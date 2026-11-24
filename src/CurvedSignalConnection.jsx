import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, CubicBezierCurve3, MathUtils, SphereGeometry, Vector3 } from 'three';

const beam = new SphereGeometry(1, 12, 8);
// Feather the sleeve towards its silhouette in the orthographic view.
const glowVertex = `
  varying float facing;
  void main() {
    facing = max(0.0, normalize(normalMatrix * normal).z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const glowFragment = `
  varying float facing;
  uniform vec3 tint;
  uniform float strength;
  void main() {
    gl_FragColor = vec4(tint, strength * pow(facing, 3.0));
  }
`;

function makePath(from, to, offset) {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const direction = b.clone().sub(a).normalize();
  const perpendicular = new Vector3(-direction.z, 0, direction.x).multiplyScalar(offset);
  a.y = b.y = -0.014;
  a.addScaledVector(direction, 0.76);
  b.addScaledVector(direction, -0.76);
  const c = a.clone().lerp(b, 0.33).add(perpendicular);
  const d = a.clone().lerp(b, 0.66).add(perpendicular);
  c.y = -0.08;
  d.y = 0.14;
  return new CubicBezierCurve3(a, c, d, b);
}

export default function CurvedSignalConnection({
  from, to, offset, tone, status, timeline, holdDuration, travelDuration, reduced,
}) {
  const curve = useMemo(() => makePath(from, to, offset), [from, to, offset]);
  const signal = useRef(null);
  const active = status === 'active';
  const glow = useMemo(() => ({
    tint: { value: new Color(tone) }, strength: { value: active ? 0.53 : 0.24 },
  }), [tone, active]);

  useFrame(() => {
    if (!active || reduced) return;
    const elapsed = timeline.elapsed + (timeline.started === null ? 0 : performance.now() - timeline.started);
    const progress = (elapsed - holdDuration) / Math.max(1, travelDuration);
    if (!signal.current) return;
    signal.current.visible = progress >= 0 && progress <= 1;
    curve.getPointAt(MathUtils.clamp(progress, 0, 1), signal.current.position);
  });

  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 32, 0.047, 8, false]} />
        <meshStandardMaterial color="#152d4d" metalness={0.62} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.044, 0]}>
        <tubeGeometry args={[curve, 32, 0.022, 8, false]} />
        <meshBasicMaterial color={active ? '#adf6ff' : '#409eff'} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.033, 0]}>
        <tubeGeometry args={[curve, 32, 0.099, 12, false]} />
        <shaderMaterial uniforms={glow} vertexShader={glowVertex} fragmentShader={glowFragment}
          blending={AdditiveBlending} transparent depthWrite={false} />
      </mesh>
      {active && !reduced && (
        <group ref={signal} visible={false}>
          <mesh geometry={beam} scale={0.079} position-y={0.044}>
            <meshBasicMaterial color="#c4efff" toneMapped={false} />
          </mesh>
          <mesh geometry={beam} scale={0.146} position-y={0.044}>
            <meshBasicMaterial color={tone} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        </group>
      )}
    </>
  );
}
