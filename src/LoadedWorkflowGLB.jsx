import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';

export default function LoadedWorkflowGLB({ url }) {
  const { scene } = useGLTF(url, false, false);
  const { model, scale, position } = useMemo(() => {
    const model = new Group();
    model.rotation.set(-0.12, 0.5, 0);
    model.add(scene.clone(true));

    const bounds = new Box3().setFromObject(model, true);
    const size = bounds.getSize(new Vector3());
    if (bounds.isEmpty() || size.x <= 0 || size.y <= 0) {
      throw new Error('Workflow model has no usable bounds: ' + url);
    }
    const center = bounds.getCenter(new Vector3());
    const scale = Math.min(1.58 / size.x, 1.32 / size.y, 1.42 / Math.max(size.z, 0.001));

    return {
      model,
      scale,
      position: [-center.x * scale, 0.15 - bounds.min.y * scale, -center.z * scale],
    };
  }, [scene, url]);

  return (
    <group position={position} scale={scale}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

