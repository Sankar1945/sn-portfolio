import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import CurvedSignalConnection from './CurvedSignalConnection';
import FloatingProcessPlatform, { ReflectionLighting } from './FloatingProcessPlatform';
import { onboardingFrameCount, workflows } from './workflows';
import WorkflowAtmosphere from './WorkflowAtmosphere';
import StageAnnotation, { placeStageAnnotation } from './StageAnnotation';

const cameraAzimuth = 0.63;
const axisScale = 1 / Math.hypot(1, cameraAzimuth);
const positions = [[-2.81, 0], [0, -1.84], [2.81, 0], [0, 2.06]].map(([right, depth]) =>
  [(right + depth * cameraAzimuth) * axisScale, 0, (depth - right * cameraAzimuth) * axisScale],
);
const tone = '#168cf5';
const up = new Vector3(0, 1, 0);
// Reserve the largest sprite at each station, including its fully raised pose.
// Billboard extents are in camera space; pedestal depth projects onto screen Y.
const stations = positions.map((position, index) => {
  const sprites = workflows.map(flow => flow.animations?.[index]).filter(Boolean);
  return {
    center: new Vector3(...position),
    left: Math.max(0.91, ...sprites.map(s => s.width * s.center)),
    right: Math.max(0.91, ...sprites.map(s => s.width * (1 - s.center))),
    aboveAnchor: Math.max(...sprites.map(s => s.width * s.bottom)),
  };
});

function ProcessNetwork({
  step, flowIndex, preview, onPreview, inspect, reduced, timeline, holdDuration, travelDuration,
  visible, parallax, animationRefs, loadedAnimations, playing, stageRef, annotationRef,
}) {
  const rig = useMemo(() => ({
    focus: new Vector3(), target: new Vector3(), direction: new Vector3(), right: new Vector3(),
    vertical: new Vector3(), position: new Vector3(), scratch: new Vector3(), ready: false,
  }), []);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    parallax.current.invalidate = invalidate;
    return () => { parallax.current.invalidate = null; };
  }, [invalidate, parallax]);

  useFrame(({ camera, size }, delta) => {
    const { focus, target, direction, right, vertical, position } = rig;
    const [x, , z] = positions[step];
    const pointer = parallax.current;
    const azimuth = Math.atan(cameraAzimuth) + (reduced ? 0 : pointer.x);
    const tilt = reduced ? 0 : pointer.y;
    direction.set(Math.sin(azimuth), (0.81 + tilt) * axisScale, Math.cos(azimuth)).normalize();
    right.crossVectors(up, direction).normalize();
    vertical.crossVectors(direction, right).normalize();
    let left = Infinity, bottom = Infinity, top = -Infinity, farRight = -Infinity;
    const pedestalBelow = 0.51 * vertical.y + 0.91 * Math.hypot(vertical.x, vertical.z);
    for (const station of stations) {
      const cx = station.center.dot(right);
      const cy = station.center.dot(vertical);
      left = Math.min(left, cx - station.left);
      farRight = Math.max(farRight, cx + station.right);
      bottom = Math.min(bottom, cy - pedestalBelow);
      top = Math.max(top, cy + 0.35 * vertical.y + station.aboveAnchor);
    }
    target.copy(right).multiplyScalar((left + farRight) / 2)
      .addScaledVector(vertical, (bottom + top) / 2);
    const inlineGutter = size.width < 430 ? 7 : 8;
    const zoom = Math.max(1, Math.min((size.width - 2 * inlineGutter) / (farRight - left),
      (size.height - 12) / (top - bottom)));
    position.copy(direction).multiplyScalar(15).add(target);
    const blend = reduced || !rig.ready || !visible ? 1 : 1 - Math.exp(-7 * Math.min(delta, 0.05));
    rig.ready = true;
    focus.lerp(target, blend);
    camera.position.lerp(position, blend);
    camera.zoom = Math.min(zoom, MathUtils.lerp(camera.zoom, zoom, blend));
    camera.lookAt(focus);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const annotation = annotationRef.current;
    const framing = [size.width, size.height, step, flowIndex, camera.zoom.toFixed(2),
      camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2)].join('/');
    if (rig.annotation !== framing || rig.annotationElement !== annotation) {
      placeStageAnnotation(annotation, camera, size, positions, workflows[flowIndex].animations, step);
      rig.annotation = framing;
      rig.annotationElement = annotation;
    }
    const activePlatform = rig.scratch.set(x, 0.02, z).project(camera);
    const stage = stageRef.current;
    if (stage) {
      stage.style.setProperty('--active-x', ((activePlatform.x * 0.5 + 0.5) * 100).toFixed(2) + '%');
      stage.style.setProperty('--active-y', ((0.5 - activePlatform.y * 0.5) * 100).toFixed(2) + '%');
    }
    if (visible && (camera.position.distanceToSquared(position) > 0.0001 ||
      focus.distanceToSquared(target) > 0.0001 || Math.abs(camera.zoom - zoom) > 0.02)) invalidate();

  });

  return (
    <>
      <ambientLight color="#b6ccef" intensity={0.72} />
      <directionalLight position={[-3, 5, 6]} color="#e2efff" intensity={2.65} />
      <directionalLight position={[4, 3, -4]} color="#729dff" intensity={2.05} />
      <ReflectionLighting />
      {positions.slice(1).map((destination, index) => (
        <CurvedSignalConnection key={index} from={positions[index]} to={destination}
          offset={index === 1 ? -0.54 : 0.58} tone={tone}
          status={index === step ? 'active' : index < step ? 'complete' : 'pending'}
          timeline={timeline} holdDuration={holdDuration} travelDuration={travelDuration} reduced={reduced} />
      ))}
      {flowIndex === 2 && step === 2 && (
        <CurvedSignalConnection from={positions[2]} to={positions[3]} offset={-0.82} tone={tone}
          status="complete" reduced={reduced} />
      )}
      {workflows[flowIndex].nodes.map(([, , type, , modelUrl], index) => (
        <FloatingProcessPlatform key={index} position={positions[index]} type={type} modelUrl={modelUrl} index={index}
          active={step === index} preview={preview === index} accent={tone} reduced={reduced}
          playing={playing}
          animation={workflows[flowIndex].animations?.[index]} timeline={timeline}
          animationRefs={animationRefs} loadedAnimations={loadedAnimations}
          visible={visible} onInspect={inspect} onPreview={onPreview} />
      ))}
    </>
  );
}

class SceneBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function WorkflowScene({ fallback, ...network }) {
  const [contextLost, setContextLost] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [visible, setVisible] = useState(false);
  const stage = useRef(null);
  const annotation = useRef(null);
  const drag = useRef(null);
  const ignoreClick = useRef(false);
  const animationRefs = useRef(new Map());
  const parallax = useRef({ x: 0, y: 0, invalidate: null });
  const [loadedAnimations, setLoadedAnimations] = useState(() => new Set());
  const animations = workflows[network.flowIndex].animations;
  const caption = workflows[network.flowIndex].nodes[network.step][3];
  const annotationKey = network.flowIndex + ':' + network.step;

  function setAnimationReady(url, ready) {
    setLoadedAnimations((current) => {
      if (current.has(url) === ready) return current;
      const next = new Set(current);
      if (ready) next.add(url);
      else next.delete(url);
      return next;
    });
    // A cached image can mount again without changing the set of loaded URLs.
    // Its new overlay still needs a frame to receive screen coordinates.
    parallax.current.invalidate?.();
  }

  useEffect(() => {
    if (!animations) setLoadedAnimations((current) => current.size ? new Set() : current);
    parallax.current.invalidate?.();
  }, [animations, loadedAnimations]);

  useEffect(() => {
    parallax.current.x = 0;
    parallax.current.y = 0;
    parallax.current.invalidate?.();
  }, [network.viewReset, network.reduced]);

  useEffect(() => {

    const element = stage.current;
    let recoveryTimer;
    function loseContext(event) {
      event.preventDefault();
      setContextLost(true);
      window.clearTimeout(recoveryTimer);
      recoveryTimer = window.setTimeout(() => setShowFallback(true), 1600);
    }
    function restoreContext() {
      window.clearTimeout(recoveryTimer);
      setContextLost(false);
      setShowFallback(false);
      window.requestAnimationFrame(() => parallax.current.invalidate?.());
    }
    element.addEventListener('webglcontextlost', loseContext, true);
    element.addEventListener('webglcontextrestored', restoreContext, true);
    // Prepare the billboards before they reach the visible edge of the page.
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) parallax.current.invalidate?.();
    }, { rootMargin: '200px 0px' });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(recoveryTimer);
      element.removeEventListener('webglcontextlost', loseContext, true);
      element.removeEventListener('webglcontextrestored', restoreContext, true);
    };
  }, []);

  function startDrag(event) {
    ignoreClick.current = false;
    if (network.reduced || event.pointerType !== 'mouse' || event.button !== 0) return;
    const { x, y } = parallax.current;
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x, y };
  }

  function movePointer(event) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId || network.reduced) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!ignoreClick.current) {
      if (Math.hypot(dx, dy) < 7) return;
      ignoreClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = 'true';
    }
    const width = event.currentTarget.clientWidth;
    parallax.current.x = MathUtils.clamp(gesture.x - dx / width, -0.19, 0.19);
    parallax.current.y = MathUtils.clamp(gesture.y + dy / width, -0.09, 0.09);
    parallax.current.invalidate?.();
  }

  function endDrag(event) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  function inspectStage(index) {
    if (!ignoreClick.current) network.inspect(index);
  }

  return (
    <SceneBoundary fallback={fallback}>
      <div className="workflow-artwork" style={showFallback ? { display: 'none' } : undefined}>
        <div ref={stage} className="workflow-stage" aria-hidden="true"
          onPointerDownCapture={startDrag} onPointerMove={movePointer} onPointerUp={endDrag}
          onPointerCancel={endDrag} onLostPointerCapture={endDrag}
          onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) endDrag(event); }}
          onClickCapture={(event) => { if (ignoreClick.current) event.stopPropagation(); }}>
          <WorkflowAtmosphere step={network.step} />
          <Canvas orthographic fallback={null} dpr={[1, 1.5]}
            frameloop={contextLost ? 'never' : visible && network.playing && !network.reduced ? 'always' : 'demand'}
            camera={{ position: [6, 9, 13], near: 0.1, far: 42 }}
            onCreated={({ gl, scene }) => { scene.background = null; gl.setClearAlpha(0); }}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
            <ProcessNetwork {...network} inspect={inspectStage} stageRef={stage} annotationRef={annotation} visible={visible} parallax={parallax} animationRefs={animationRefs} loadedAnimations={loadedAnimations} />
          </Canvas>
          {animations?.map(({ url }, index) => (
            <div key={url} ref={(node) => {
              if (node) animationRefs.current.set(index, node);
              else animationRefs.current.delete(index);
            }} className="workflow-animation" data-ready={loadedAnimations.has(url)}
              data-active={network.step === index}
              onPointerEnter={(event) => { if (event.pointerType === 'mouse') network.onPreview(index); }}
              onPointerLeave={() => network.onPreview((current) => current === index ? null : current)}
              onClick={() => inspectStage(index)}>
              <img src={url} alt="" draggable={false}
                style={{ width: (onboardingFrameCount * 100) + '%' }}
                onLoad={() => setAnimationReady(url, true)} onError={() => setAnimationReady(url, false)} />
            </div>
          ))}
          <div ref={annotation} className="workflow-annotation">
            <StageAnnotation key={annotationKey} caption={caption} paused={!network.playing} />
          </div>
        </div>
        <div className="workflow-annotation-lane" aria-hidden="true">
          <StageAnnotation key={annotationKey} caption={caption} paused={!network.playing} />
        </div>
      </div>
      {showFallback && fallback}
    </SceneBoundary>
  );
}
