import React from 'react';
import { CylinderGeometry, SphereGeometry, TorusGeometry } from 'three';

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const box = new RoundedBoxGeometry(1, 1, 1, 2, 0.075);
const cylinder = new CylinderGeometry(1, 1, 1, 24);
const sphere = new SphereGeometry(1, 16, 12);
const ring = new TorusGeometry(1, 0.105, 8, 24);
const paper = '#d4e5f9';
const navy = '#203758';
const blue = '#6fb8ff';
const violet = '#ad93ee';
const green = '#78e2b0';

function Part({ geometry = box, at = [0, 0, 0], size, rotation, color = paper, glow = 0 }) {
  return (
    <mesh geometry={geometry} position={at} scale={size} rotation={rotation}>
      <meshStandardMaterial color={color} roughness={0.39} metalness={0.19}
        emissive={color} emissiveIntensity={glow} />
    </mesh>
  );
}

function Stroke({ from, to, color = blue, width = 0.045, depth = 0.10 }) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  return <Part at={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, depth]}
    size={[Math.hypot(dx, dy), width, 0.04]} rotation={[0, 0, Math.atan2(dy, dx)]} color={color} glow={0.18} />;
}

function Document({ type }) {
  const scanner = type === 'scanner';
  const checklist = type === 'checklist';
  return (
    <>
      <Part at={[-0.065, 0.04, -0.068]} size={[0.82, 0.95, 0.115]} color={navy} />
      <Part at={[-0.07, 0.02, 0]} size={[0.76, 0.91, 0.105]} color={paper} />
      <Part at={[-0.07, 0.30, 0.053]} size={[0.54, 0.095, 0.025]} color={blue} />
      {[0.12, -0.04, -0.20].map((y) => (
        <React.Fragment key={y}>
          <Part at={[0.015, y, 0.058]} size={[0.35, 0.036, 0.023]} color={navy} />
          {checklist && <Part at={[-0.29, y, 0.061]} size={[0.09, 0.09, 0.025]} color={green} />}
        </React.Fragment>
      ))}
      {scanner && <>
        <Part geometry={ring} at={[0.29, -0.075, 0.16]} size={[0.24, 0.24, 0.33]} color={blue} glow={0.32} />
        <Stroke from={[0.45, -0.24]} to={[0.61, -0.41]} width={0.10} depth={0.16} />
      </>}
      {checklist && <>
        <Stroke from={[0.21, -0.24]} to={[0.31, -0.35]} color={green} depth={0.15} />
        <Stroke from={[0.31, -0.35]} to={[0.56, -0.05]} color={green} depth={0.15} />
      </>}
      {type === 'invoice' && <>
        <Part at={[0, -0.36, 0.09]} size={[1.04, 0.13, 0.52]} color={navy} />
        {[-0.48, 0.48].map((x) => (
          <Part key={x} at={[x, -0.27, 0.13]} size={[0.10, 0.18, 0.44]} color={blue} />
        ))}
        <Part at={[0, -0.28, 0.34]} size={[0.98, 0.105, 0.06]} color={blue} />
      </>}
    </>
  );
}

function Identity({ account }) {
  return (
    <>
      <Part size={[1, 0.68, 0.10]} color={account ? navy : paper} />
      <Part at={[-0.22, 0.095, 0.09]} size={[0.12, 0.12, 0.065]} geometry={sphere} color={blue} />
      <Part at={[-0.22, -0.12, 0.085]} size={[0.205, 0.115, 0.07]} geometry={sphere} color={blue} />
      {[0.13, -0.04, -0.18].map((y) =>
        <Part key={y} at={[0.225, y, 0.06]} size={[0.31, 0.042, 0.025]} color={account ? paper : navy} />)}
      {account && <>
        <Part geometry={cylinder} at={[0.43, 0.29, 0.09]} size={[0.18, 0.07, 0.18]} rotation={[Math.PI / 2, 0, 0]} color={blue} />
        <Stroke from={[0.34, 0.29]} to={[0.52, 0.29]} color={paper} depth={0.15} />
        <Stroke from={[0.43, 0.20]} to={[0.43, 0.38]} color={paper} depth={0.15} />
      </>}
    </>
  );
}

function Envelope({ notification }) {
  return (
    <>
      <Part size={[0.99, 0.65, 0.13]} color={paper} />
      <Stroke from={[-0.47, 0.29]} to={[0, -0.06]} color={navy} />
      <Stroke from={[0, -0.06]} to={[0.47, 0.29]} color={navy} />
      <Part geometry={sphere} at={[0.43, 0.30, 0.12]} size={[0.16, 0.16, 0.10]}
        color={notification ? violet : green} glow={0.32} />
    </>
  );
}

function Details({ type }) {
  switch (type) {
    case 'invoice': case 'scanner': case 'checklist': return <Document type={type} />;
    case 'badge': case 'account': return <Identity account={type === 'account'} />;
    case 'welcome': case 'notification': return <Envelope notification={type === 'notification'} />;
    case 'database':
      return [-0.25, 0, 0.25].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <Part geometry={cylinder} size={[0.39, 0.19, 0.31]} color={navy} />
          <Part geometry={cylinder} at={[0, 0.10, 0]} size={[0.405, 0.046, 0.32]} color={blue} glow={0.25} />
        </group>
      ));
    case 'shield':
      return <>
        <Part at={[0, 0.15, 0]} size={[0.69, 0.48, 0.16]} color={navy} />
        <Part at={[0, -0.115, 0]} size={[0.48, 0.48, 0.16]} rotation={[0, 0, Math.PI / 4]} color={navy} />
        <Part geometry={ring} at={[-0.13, 0.15, 0.11]} size={[0.13, 0.13, 0.23]} color={blue} />
        <Stroke from={[-0.05, 0.07]} to={[0.23, -0.18]} depth={0.13} />
        <Stroke from={[0.15, -0.11]} to={[0.26, -0.02]} depth={0.13} />
      </>;
    case 'ticket':
      return <>
        <Part size={[1.04, 0.67, 0.11]} color={paper} />
        <Part at={[-0.40, 0, 0.063]} size={[0.16, 0.61, 0.018]} color={blue} />
        {[0.16, 0, -0.16].map((y) => <Part key={y} at={[0.10, y, 0.069]} size={[0.56, 0.049, 0.02]} color={navy} />)}
      </>;
    case 'processor':
      return <>
        <Part size={[0.64, 0.64, 0.17]} color={navy} />
        <Part at={[0, 0, 0.11]} size={[0.36, 0.36, 0.05]} color={violet} glow={0.37} />
        {[-0.21, 0, 0.21].map((v) => <React.Fragment key={v}>
          <Part at={[v, 0, 0]} size={[0.055, 0.93, 0.08]} color={blue} />
          <Part at={[0, v, 0]} size={[0.93, 0.055, 0.08]} color={blue} />
        </React.Fragment>)}
      </>;
    case 'decision':
      return <>
        <Part size={[0.98, 0.66, 0.15]} color={navy} />
        <Stroke from={[-0.37, 0]} to={[-0.03, 0]} />
        <Stroke from={[-0.03, 0]} to={[0.33, 0.22]} />
        <Stroke from={[-0.03, 0]} to={[0.33, -0.22]} color={violet} />
        <Part at={[-0.035, 0, 0.12]} size={[0.17, 0.17, 0.07]} rotation={[0, 0, Math.PI / 4]} />
        <Part geometry={sphere} at={[0.36, 0.22, 0.10]} size={[0.073, 0.073, 0.07]} color={blue} />
        <Part geometry={sphere} at={[0.36, -0.22, 0.10]} size={[0.073, 0.073, 0.07]} color={violet} />
      </>;
    default: return null;
  }
}

export default function WorkflowObject({ type, illuminated }) {
  return (
    <group position={[0, 0.81, 0]} rotation={[-0.17, 0.47, 0]} scale={1.62}>
      {illuminated && <pointLight position={[-0.32, 0.44, 0.42]} color="#86c9ff" intensity={0.85} distance={2.2} />}
      <Details type={type} />
    </group>
  );
}
