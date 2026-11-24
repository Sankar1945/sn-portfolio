import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CircleGeometry, Color, CylinderGeometry, DataTexture, LatheGeometry, LinearFilter, MathUtils, PlaneGeometry, PMREMGenerator, Vector2, Vector3 } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import WorkflowObject from './WorkflowObject';
import { onboardingFrameCount, onboardingFrameDuration } from './workflows';
import WorkflowGLBModel from './WorkflowGLBModel';

const lower = new CylinderGeometry(0.82, 0.75, 0.14, 6);
const housing = new LatheGeometry([
  new Vector2(0.82, -0.36), new Vector2(0.886, -0.294),
  new Vector2(0.902, -0.24), new Vector2(0.902, -0.016), new Vector2(0.894, 0.039),
], 6);
const shoulder = new CylinderGeometry(0.85, 0.90, 0.088, 6, 1, true);
const top = new CircleGeometry(0.85, 6, Math.PI / 6);
const bevel = new CylinderGeometry(0.901, 0.895, 0.024, 6, 1, true);
const ring = new LatheGeometry([
  new Vector2(0.864, 0.111), new Vector2(0.851, 0.134), new Vector2(0.823, 0.134),
], 6);
const trim = new CylinderGeometry(0.899, 0.893, 0.016, 6, 1, true);
const platformRotation = Math.PI / 6;
const edgePlane = new PlaneGeometry(2.12, 2.12);
const pool = new PlaneGeometry(2.95, 2.95);
const grain = new DataTexture(Uint8Array.from({ length: 128 * 4 }, (_, index) => {
  const row = Math.floor(index / 4);
  return index % 4 === 3 ? 255 : 205 + (row * 37 % 43);
}), 1, 128);
grain.magFilter = LinearFilter;
grain.minFilter = LinearFilter;
grain.needsUpdate = true;
const vertex = 'varying vec2 p; void main(){p=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const fragment = 'varying vec2 p; uniform vec3 tint; uniform float alpha; void main(){float r=length((p-.5)*2.0); gl_FragColor=vec4(tint,pow(max(1.0-r,0.0),2.0)*alpha);}';

const edgeFragment = `
  varying vec2 p;
  uniform float edge;
  uniform float strength;
  uniform float spread;
  void main() {
    vec2 v = abs((p - 0.5) * 2.12);
    float d = max(v.x, dot(v, vec2(0.5, 0.8660254)));
    float glow = exp(-abs(d - edge) / spread);
    float fade = 1.0 - smoothstep(0.94, 1.06, max(v.x, v.y));
    float highlight = smoothstep(-0.65, 0.65, p.x - p.y);
    vec3 ice = mix(vec3(0.09, 0.41, 1.0), vec3(0.21, 0.88, 1.0), highlight);
    gl_FragColor = vec4(ice, glow * fade * strength);
  }
`;

export function ReflectionLighting() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const previous = scene.environment;
    let reflections;

    function rebuildReflections() {
      const room = new RoomEnvironment();
      const generator = new PMREMGenerator(gl);
      try {
        const next = generator.fromScene(room, 0.19);
        reflections?.dispose();
        reflections = next;
        scene.environment = reflections.texture;
      } finally {
        room.dispose();
        generator.dispose();
      }
    }

    rebuildReflections();
    gl.domElement.addEventListener('webglcontextrestored', rebuildReflections);
    return () => {
      gl.domElement.removeEventListener('webglcontextrestored', rebuildReflections);
      scene.environment = previous;
      reflections?.dispose();
    };
  }, [gl, scene]);
  return null;
}

function LightPool({ color, opacity, height, scale = 1 }) {
  const uniforms = useMemo(() => ({ tint: { value: new Color(color) }, alpha: { value: opacity } }), [color, opacity]);
  return (
    <mesh geometry={pool} position={[0, height, 0]} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
        transparent depthWrite={false} />
    </mesh>
  );
}

export default function FloatingProcessPlatform({
  position, type, modelUrl, index, active, preview, accent, reduced, visible, onInspect, onPreview, animation, animationRefs, loadedAnimations, timeline,
}) {
  const artwork = useRef();
  const activation = useRef(null);
  const ringMaterial = useRef();
  const halo = useMemo(() => ({ edge: { value: 0.724 }, strength: { value: 0.23 }, spread: { value: 0.047 } }), []);
  const reflection = useMemo(() => ({ edge: { value: 0.707 }, strength: { value: 0.12 }, spread: { value: 0.098 } }), []);
  const trimMaterial = useRef();


  const animationReady = Boolean(animation && loadedAnimations.has(animation.url));
  const projected = useMemo(() => new Vector3(), []);
  const placeholder = <WorkflowObject type={type} illuminated={active || preview} />;
  useFrame(({ invalidate, camera, size }, delta) => {
    const target = active || (!animation && preview) ? 0.21 : 0;
    const y = reduced || !visible || (animation && !active) ? target : MathUtils.damp(artwork.current.position.y, target, 8, delta);
    const moving = Math.abs(y - target) > 0.002;
    artwork.current.position.y = moving ? y : target;
    if (moving) invalidate();

    const glow = active ? 2.65 : 1.25;
    const warm = active ? 0.42 : 0.035;
    const material = ringMaterial.current;
    const secondary = trimMaterial.current;
    const smooth = (current, goal) => reduced || !visible ? goal : MathUtils.damp(current, goal, 7, delta);
    material.emissiveIntensity = smooth(material.emissiveIntensity, glow);
    secondary.emissiveIntensity = smooth(secondary.emissiveIntensity, warm);
    halo.strength.value = smooth(halo.strength.value, active ? 0.65 : 0.32);
    reflection.strength.value = smooth(reflection.strength.value, active ? 0.35 : 0.14);
    if (Math.abs(material.emissiveIntensity - glow) > 0.01 || Math.abs(secondary.emissiveIntensity - warm) > 0.01) invalidate();

    const overlay = animationRefs.current.get(index);
    const image = overlay?.firstElementChild;
    if (!animation || !animationReady || !image?.naturalWidth) return;

    let frame = animation.posterFrame ?? 0;
    if (active && !reduced && (timeline.started !== null || timeline.elapsed > 0)) {
      const elapsed = timeline.elapsed + (timeline.started === null ? 0 : performance.now() - timeline.started);
      if (activation.current?.timeline !== timeline) activation.current = { timeline, origin: elapsed };
      const frameDuration = animation.frameDuration ?? onboardingFrameDuration;
      frame = Math.min(onboardingFrameCount - 1, Math.floor((elapsed - activation.current.origin) / frameDuration));
      frame = Math.max(0, frame);
    } else {
      activation.current = null;
    }
    if (overlay.dataset.frame !== String(frame + 1)) {
      image.style.transform = 'translateX(' + (-frame * 100 / onboardingFrameCount) + '%)';
      overlay.dataset.frame = String(frame + 1);
    }
    projected.set(position[0], position[1] + artwork.current.position.y + 0.14, position[2]).project(camera);
    const width = animation.width * size.width * camera.zoom / (camera.right - camera.left);
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const screenY = (0.5 - projected.y * 0.5) * size.height;
    overlay.style.width = width + 'px';
    overlay.style.transform = 'translate(' + (x - width * animation.center) + 'px,' + (screenY - width * animation.bottom) + 'px)';
    overlay.dataset.positioned = 'true';
  });

  return (
    <group position={position}>
      <LightPool color="#01050c" opacity={0.95} height={-0.54} scale={1.30} />
      <LightPool color={accent} opacity={active ? 0.79 : 0.49} height={-0.525} scale={1.07} />
      <group onClick={(event) => { event.stopPropagation(); onInspect(index); }}
        onPointerOver={(event) => { event.stopPropagation(); onPreview(index); }}
        onPointerOut={() => onPreview((current) => current === index ? null : current)}>
        <group rotation={[0, platformRotation, 0]}>
          <mesh geometry={lower} position={[0, -0.427, 0]}>
            <meshStandardMaterial color="#111824" metalness={0.68} roughness={0.46} flatShading />
          </mesh>
          <mesh geometry={housing}>
            <meshStandardMaterial color="#344258" metalness={0.87} roughness={0.35} roughnessMap={grain} flatShading />
          </mesh>
          <mesh geometry={shoulder} position={[0, 0.088, 0]}>
            <meshStandardMaterial color="#455974" roughness={0.31} metalness={0.84} flatShading />
          </mesh>
          <mesh geometry={top} position={[0, 0.132, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshPhysicalMaterial color="#172638" metalness={0.63} roughness={0.27} clearcoat={0.76} clearcoatRoughness={0.19} flatShading />
          </mesh>
          <mesh geometry={bevel} position={[0, 0.033, 0]}>
            <meshStandardMaterial color="#879bb7" metalness={0.89} roughness={0.28} flatShading />
          </mesh>
          <mesh geometry={ring}>
            <meshStandardMaterial ref={ringMaterial} color="#123859" emissive="#129bfc" emissiveIntensity={1.25} toneMapped={false}
              metalness={0.31} roughness={0.30} flatShading />
          </mesh>
          <mesh geometry={edgePlane} position={[0, 0.136, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <shaderMaterial uniforms={halo} vertexShader={vertex} fragmentShader={edgeFragment} transparent depthWrite={false} />
          </mesh>
          <mesh geometry={edgePlane} position={[0, 0.134, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.93}>
            <shaderMaterial uniforms={reflection} vertexShader={vertex} fragmentShader={edgeFragment} transparent depthWrite={false} />
          </mesh>
          <mesh geometry={trim} position={[0, -0.253, 0]}>
            <meshStandardMaterial ref={trimMaterial} color="#536376" emissive={accent} emissiveIntensity={0}
              metalness={0.66} roughness={0.43} flatShading />
          </mesh>
        </group>
        <LightPool color="#060a13" opacity={0.75} height={0.137} scale={0.53} />
        <group ref={artwork}>
          {!animationReady && (modelUrl ? (
            <>
              <pointLight position={[-0.42, 1.15, 0.8]} color="#afdcff"
                intensity={active || preview ? 1.2 : 0.5} distance={2.5} />
              <WorkflowGLBModel url={modelUrl} fallback={placeholder} />
            </>
          ) : placeholder)}
        </group>
      </group>
    </group>
  );
}
