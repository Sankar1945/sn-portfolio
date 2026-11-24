import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import { AdditiveBlending } from 'three';

const exportsFound = import.meta.glob('./reactor.glb', {
  eager: true, query: '?url', import: 'default',
});
export const modelUrl = exportsFound['./reactor.glb'];

export const cameraPosition = [3.70, 2.63, 5.15];
export const cameraTarget = [0, 1.40, 0];

function ResponsiveLens({ fixed }) {
  const camera = useThree(state => state.camera);
  const invalidate = useThree(state => state.invalidate);
  const { width, height } = useThree(state => state.size);
  React.useLayoutEffect(() => {
    camera.fov = Math.min(72, Math.max(36, 36.5 * height / Math.max(width, 1)));
    if (fixed) camera.lookAt(...cameraTarget);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, invalidate, fixed]);
  return null;
}

function Reactor({ running, activation }) {
  const { scene } = useGLTF(modelUrl);
  const light = useRef(null);
  const elapsed = useRef(0);
  const pulse = useRef({ activation, level: 0 });
  const [{ model, levitation, outer, inner, core, dock, rotor, energy, displayMaterials, baseHeight }] = useState(() => {
    const model = scene.clone(true);
    const node = name => {
      const object = model.getObjectByName(name);
      if (!object) throw new Error('Missing model node ' + name + '. Re-export with the reactor generator.');
      return object;
    };
    const levitation = node('LevitationRoot');
    const inner = node('InnerGlass');
    const sources = new Map();
    const displayMaterials = new Set();
    inner.traverse(object => {
      if (!object.isMesh) return;
      const glass = (object.material = object.material.clone());
      glass.transmission = 0;
      glass.transparent = true;
      glass.opacity = 0.32;
      glass.depthWrite = false;
      displayMaterials.add(glass);
    });
    const shell = node('AmberFacetedShell');
    const amber = (shell.material = shell.material.clone());
    amber.thickness = 0.23;
    amber.attenuationDistance = 2.4;
    amber.attenuationColor.set('#ffad6d');
    displayMaterials.add(amber);
    node('EnergyElements').traverse(object => {
      if (!object.isMesh || !object.material.emissive) return;
      const source = object.material;
      if (!sources.has(source)) sources.set(source, source.clone());
      object.material = sources.get(source);
    });
    return {
      model, levitation, baseHeight: levitation.position.y,
      outer: node('OuterSculpture'), inner, core: node('CrystalCore'),
      dock: node('DockBase'), rotor: node('DockRotatingRing'),
      displayMaterials,
      energy: [...sources.values()].map(material => ({ material, strength: material.emissiveIntensity })),
    };
  });

  useEffect(() => () => {
    energy.forEach(({ material }) => material.dispose());
    displayMaterials.forEach(material => material.dispose());
  }, [energy, displayMaterials]);

  useFrame((_, delta) => {
    if (!running) {
      pulse.current = { activation, level: 0 };
      return;
    }
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;
    if (pulse.current.activation !== activation) pulse.current = { activation, level: 0.35 };
    pulse.current.level *= Math.exp(-3.1 * dt);
    const t = elapsed.current;
    const tau = Math.PI * 2;
    const breath = (1 - Math.cos(t * tau / 4.2)) * 0.5;
    const surge = Math.pow((1 + Math.sin(t * tau / 12.5 + 0.5)) * 0.5, 12) * 0.19;
    outer.rotation.set(0.11 * Math.sin(t * 0.55), t * tau / 21, 0.08 * Math.sin(t * 0.47));
    inner.rotation.set(0.14, -t * tau / 14, 0.13 * Math.sin(t * 0.49));
    core.rotation.set(0.08 * Math.sin(t * 0.6), t * tau / 32, 0.09);
    core.position.y = Math.sin(t * tau / 4.8) * 0.035;
    core.scale.setScalar(1 + breath * 0.044);
    levitation.position.y = baseHeight + Math.sin(t * tau / 6.8) * 0.069;
    rotor.rotation.y = -t * tau / 55;
    const power = 0.93 + breath * 0.27 + surge + pulse.current.level;
    energy.forEach(({ material, strength }) => { material.emissiveIntensity = strength * power; });
    light.current.position.y = levitation.position.y + core.position.y;
    light.current.intensity = 2.2 * power;
  });

  return <>
    <primitive object={model} dispose={null} />
    <pointLight ref={light} position={[0, baseHeight, 0]} color="#ff713f" intensity={2.2} distance={2.4} decay={2} />
    <mesh position={[0, dock.position.y + 0.405, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[1.72, 1.72]} />
      <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
        vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader="varying vec2 vUv; void main() { float distanceToCenter = length(vUv - 0.5) * 2.0; float glow = 1.0 - smoothstep(0.10, 0.9, distanceToCenter); gl_FragColor = vec4(0.95, 0.19, 0.035, 0.20 * glow * glow); }" />
    </mesh>
  </>;
}

export default function ReactorCanvas({ running, reduced, controls, activation, fallback, background = '#161a23' }) {
  if (!modelUrl) return fallback;
  return (
    <Canvas camera={{ position: cameraPosition, fov: 36, near: 0.1, far: 40 }} dpr={[1, 1.5]}
      frameloop={running ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, stencil: false }}
      fallback={fallback}>
      <ResponsiveLens fixed={!controls} />
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[4, 5, 4]} color="#fff0dd" intensity={1.48} />
      <directionalLight position={[-4, 1, 3]} color="#b8c7df" intensity={0.72} />
      <directionalLight position={[-3, 3, -4]} color="#ffc08b" intensity={1.65} />
      <Environment resolution={128} frames={1} environmentIntensity={0.86}>
        <Lightformer intensity={1.75} color="#fff4e9" position={[0, 3, 4]} scale={[5, 2.7, 1]} />
        <Lightformer color="#e1ebff" intensity={1.5} position={[-3, 1, 0]} scale={[2.1, 4, 1]} />
        <Lightformer color="#ffc19c" intensity={1.55} position={[2, 2, -3]} scale={[2.2, 4, 1]} />
        <Lightformer color="#d2dfef" intensity={0.55} position={[0, -2.3, 3]} scale={[5, 2, 1]} />
      </Environment>
      <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[5, 5]} />
        <shaderMaterial transparent depthWrite={false}
          vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
          fragmentShader="varying vec2 vUv; void main() { float radius = length(vUv - 0.5) * 2.0; float shadow = 1.0 - smoothstep(0.46, 0.89, radius); gl_FragColor = vec4(0.025, 0.026, 0.03, shadow * 0.65); }" />
      </mesh>
      <Reactor running={running} activation={activation} />
      {controls && <OrbitControls ref={controls} makeDefault target={cameraTarget}
        minDistance={4.2} maxDistance={12} maxPolarAngle={Math.PI * 0.49}
        enableDamping={!reduced} enablePan={false} />}
    </Canvas>
  );
}
