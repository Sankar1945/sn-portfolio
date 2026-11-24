import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { MathUtils } from 'three';

const blue = '#168cf5';
const lime = '#b8ff45';
const tau = Math.PI * 2;
const ports = [2.46, 0.68, 3.82, 5.60];
const titanium = { color: '#8194ab', metalness: 0.84, roughness: 0.28 };
const chrome = { color: '#202c40', metalness: 0.9, roughness: 0.21 };

function Block({ size, position, material = titanium, radius = 0.04 }) {
  return <RoundedBox args={size} position={position} radius={radius} smoothness={2} castShadow>
    <meshStandardMaterial {...material} />
  </RoundedBox>;
}

function Band({ radius, thickness, z, material = chrome }) {
  return <mesh position-z={z} castShadow>
    <torusGeometry args={[radius, thickness, 10, 56]} />
    <meshStandardMaterial {...material} />
  </mesh>;
}

function Rotor({ rotorRef, inner = false }) {
  const radius = inner ? 0.84 : 1.29;
  const segments = inner ? 6 : 8;
  return <group rotation={inner ? [0.25, -0.15, 0] : [0, 0, 0]} position-z={inner ? 0.34 : 0}>
    <group ref={rotorRef}>
      <Band radius={radius} thickness={inner ? 0.075 : 0.14} z={-0.03} />
      <Band radius={radius + 0.06} thickness={0.033} z={0.11} material={titanium} />
      <Band radius={radius - 0.06} thickness={0.024} z={0.15}
        material={{ color: '#355f81', emissive: blue, emissiveIntensity: inner ? 1.8 : 1.15 }} />
      {Array.from({ length: segments }, (_, index) => (
        <group key={index} rotation-z={tau * index / segments}>
          <Block size={inner ? [0.19, 0.29, 0.18] : [0.29, 0.49, 0.32]} position={[radius, 0, 0.03]} />
          <Block size={inner ? [0.12, 0.2, 0.06] : [0.19, 0.36, 0.075]} position={[radius, 0, inner ? 0.15 : 0.22]} material={chrome} />
          <Block size={[0.035, inner ? 0.14 : 0.23, 0.023]} position={[radius + 0.02, 0, inner ? 0.19 : 0.27]}
            material={{ color: '#61ceff', emissive: blue, emissiveIntensity: 1.65 }} radius={0.009} />
        </group>
      ))}
    </group>
  </group>;
}

function Reactor({ active, moving }) {
  const housing = useRef(null);
  const outer = useRef(null);
  const inner = useRef(null);
  const core = useRef(null);
  const coreMaterial = useRef(null);
  const lamps = useRef([]);
  const timing = useRef({ time: 0, lastActive: active, surge: 0 });

  useFrame((_, delta) => {
    const state = timing.current;
    const dt = Math.min(0.05, delta);
    if (moving) {
      state.time += dt;
      if (active !== state.lastActive && active >= 0) state.surge = 1;
      state.surge *= Math.exp(-2.1 * dt);
      outer.current.rotation.z = -tau * (state.time / 16);
      inner.current.rotation.z = tau * (state.time / 10);
      housing.current.position.y = Math.sin(state.time * 1.35) * 0.045;
    }
    state.lastActive = active;
    const breath = moving ? (1 - Math.cos(tau * state.time / 3.5)) * 0.5 : 0.4;
    core.current.scale.setScalar(1 + 0.08 * breath);
    coreMaterial.current.emissiveIntensity = 1.5 + breath * 0.65 + (moving ? state.surge * 1.15 : 0);
    lamps.current.forEach((material, index) => {
      if (!material) return;
      const target = active === index ? 2.9 : active < 0 ? 1.48 : 0.47;
      material.emissiveIntensity = moving ? MathUtils.damp(material.emissiveIntensity, target, 7, dt) : target;
    });
  });

  return <group ref={housing} rotation={[0.19, -0.23, 0]}>
    <mesh rotation-x={Math.PI * 0.5} position-z={-0.36} castShadow receiveShadow>
      <cylinderGeometry args={[1.46, 1.58, 0.38, 48]} />
      <meshStandardMaterial {...chrome} />
    </mesh>
    <Band radius={1.46} thickness={0.06} z={-0.33} material={titanium} />
    <Band radius={1.47} thickness={0.035} z={-0.18} material={{ color: '#275773', emissive: blue, emissiveIntensity: 0.6 }} />
    {ports.map((angle, index) => (
      <group key={angle} rotation-z={angle}>
        <Block size={[0.58, 0.41, 0.42]} position={[1.52, 0, -0.25]} material={chrome} />
        <Block size={[0.27, 0.33, 0.46]} position={[1.82, 0, -0.24]} />
        <mesh position={[1.89, 0, -0.02]}>
          <boxGeometry args={[0.19, 0.13, 0.06]} />
          <meshStandardMaterial ref={material => { lamps.current[index] = material; }}
            color="#67ceff" emissive={blue} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <Block size={[0.064, 0.057, 0.035]} position={[1.73, 0.15, -0.004]}
          material={{ color: lime, emissive: lime, emissiveIntensity: 0.7 }} radius={0.011} />
      </group>
    ))}
    {Array.from({ length: 8 }, (_, index) => (
      <group key={index} rotation-z={tau * index / 8 + 0.2}>
        <Block size={[0.15, 0.11, 0.08]} position={[1.4, 0, -0.105]} material={titanium} />
        <Block size={[0.08, 0.21, 0.08]} position={[1.13, 0, -0.14]} material={chrome} />
      </group>
    ))}
    <Rotor rotorRef={outer} />
    <Rotor rotorRef={inner} inner />
    <group ref={core} position-z={0.39}>
      <mesh rotation={[0.2, 0.42, 0.2]} scale={[0.82, 1.05, 0.84]}>
        <icosahedronGeometry args={[0.49, 0]} />
        <meshPhysicalMaterial color="#7edaff" emissive={blue} emissiveIntensity={0.45}
          transparent opacity={0.35} depthWrite={false} roughness={0.12} metalness={0.23} clearcoat={1} />
      </mesh>
      <mesh rotation={[0.2, 0.42, 0.2]} scale={[0.78, 1.05, 0.82]}>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial ref={coreMaterial} color="#57ccff" emissive="#087fff" emissiveIntensity={1.5}
          roughness={0.24} metalness={0.25} flatShading />
      </mesh>
      <pointLight color={blue} intensity={2.3} distance={1.7} decay={1.6} />
    </group>
    <mesh position-z={0.43}>
      <torusGeometry args={[0.62, 0.05, 10, 40]} />
      <meshPhysicalMaterial color="#759bb7" transparent opacity={0.42} depthWrite={false}
        roughness={0.17} metalness={0.45} clearcoat={0.9} />
    </mesh>
  </group>;
}

export default function EnergyReactor3D({ active, moving }) {
  return <Canvas camera={{ position: [2.35, 2.6, 10], fov: 30 }} dpr={[1, 1.5]}
    frameloop={moving ? 'always' : 'demand'} gl={{ alpha: true, antialias: true }} shadows
    fallback={<div className="toolkit-reactor__fallback" aria-hidden="true">Skills constellation</div>}>
    <ambientLight intensity={0.6} />
    <directionalLight color="#d6f0ff" intensity={2.8} position={[-4, 5, 7]} castShadow shadow-mapSize={[256, 256]} />
    <directionalLight color="#7fb7ff" intensity={1.55} position={[4, -1, 4]} />
    <Environment resolution={64} frames={1}>
      <Lightformer intensity={2.4} position={[0, 3, 3]} scale={[6, 2, 1]} />
      <Lightformer color="#81bdff" intensity={2.1} position={[-3, -1, 2]} scale={[2, 3, 1]} />
    </Environment>
    <Reactor active={active} moving={moving} />
    <mesh rotation-x={-Math.PI / 2} position={[0, -2.06, 0]} receiveShadow>
      <planeGeometry args={[6, 5]} />
      <shadowMaterial opacity={0.2} />
    </mesh>
  </Canvas>;
}
