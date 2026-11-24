import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import { Bloom } from '@react-three/postprocessing';
import { AdditiveBlending, DoubleSide, HalfFloatType, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderTarget } from 'three';

const exportsFound = import.meta.glob('./reactor-v3.glb', {
  eager: true, query: '?url', import: 'default',
});
export const modelUrl = exportsFound['./reactor-v3.glb'];

export const cameraPosition = [4.05, 2.86, 5.60];
export const cameraTarget = [0, 1.40, 0];

function ResponsiveLens({ fixed, phase, running }) {
  const camera = useThree(state => state.camera);
  const invalidate = useThree(state => state.invalidate);
  const { width, height } = useThree(state => state.size);
  React.useLayoutEffect(() => {
    camera.fov = Math.min(72, Math.max(36, 36.5 * height / Math.max(width, 1)));
    if (fixed) camera.lookAt(...cameraTarget);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, invalidate, fixed]);
  useFrame((_, delta) => {
    if (!fixed || !running) return;
    const goal = phase === 'releasing' ? 0.92 : 1;
    const factor = 1 - Math.exp(-6 * Math.min(delta, 0.05));
    camera.position.x += (cameraPosition[0] * goal - camera.position.x) * factor;
    camera.position.y += ((cameraPosition[1] - cameraTarget[1]) * goal + cameraTarget[1] - camera.position.y) * factor;
    camera.position.z += (cameraPosition[2] * goal - camera.position.z) * factor;
    camera.lookAt(...cameraTarget);
  });
  return null;
}

const tau = Math.PI * 2;
const vertex = 'varying vec2 vUv; varying float facing; void main(){ vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.0); facing=abs(dot(normalize(normalMatrix*normal),normalize(-p.xyz))); gl_Position=projectionMatrix*p; }';
const energyBeam = `
  varying vec2 vUv;
  varying float facing;
  uniform float time;
  uniform float power;
  void main() {
    float ends = smoothstep(0.0,.16,vUv.y)*(1.0-smoothstep(.66,1.0,vUv.y));
    float flow = .58 + .42*pow(.5 + .5*cos(vUv.y*27.0-time*3.0+sin(vUv.x*18.85)*.42),3.0);
    float alpha = ends * pow(smoothstep(.09,.99,facing),1.8) * flow * (.07 + .055*power);
    gl_FragColor = vec4(1.65,.30,.047,alpha);
  }
`;
const pool = `
  varying vec2 vUv;
  void main() {
    float r = length(vUv-.5)*2.;
    float falloff = 1.-smoothstep(.39,.94,r);
    gl_FragColor = vec4(.72,.13,.019,falloff*falloff*.27);
  }
`;

function addCurrent(material, time, orbital) {
  material.onBeforeCompile = shader => {
    shader.uniforms.reactorTime = time;
    shader.vertexShader = 'varying vec3 reactorSample;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nreactorSample = ' + (orbital ? 'vec3(uv, 0.0);' : 'position;'),
    );
    shader.fragmentShader = 'uniform float reactorTime; varying vec3 reactorSample;\n' + shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n' + (orbital
        ? 'float wave = pow(0.5 + 0.5*cos(reactorSample.x*18.85-reactorTime*2.4), 6.0); totalEmissiveRadiance *= 0.78 + wave*1.48;'
        : 'float wave = sin(25.0*reactorSample.y+4.5*sin(19.0*reactorSample.x+reactorTime*0.8)+reactorTime*2.1); float filament = pow(0.5+0.5*wave,4.0); totalEmissiveRadiance *= mix(vec3(0.85,0.65,0.49),vec3(1.53,1.60,1.63),filament);'),
    );
  };
  material.customProgramCacheKey = () => orbital ? 'v3-orbital-current' : 'v3-crystal-current';
}

function Reactor({ running, phase }) {
  const { scene } = useGLTF(modelUrl);
  const invalidate = useThree(state => state.invalidate);
  const light = useRef(null);
  const beam = useRef(null);
  const elapsed = useRef(0);
  const spin = useRef(0);
  const level = useRef(0);
  const [{ model, levitation, rings, glass, core, rotor, baseHeight, owned, lamps, time, beamUniforms }] = useState(() => {
    const model = scene.clone(true);
    const node = name => {
      const object = model.getObjectByName(name);
      if (!object) throw new Error('The V3 export is missing ' + name + '.');
      return object;
    };
    const owned = [];
    const lamps = [];
    const time = { value: 0 };
    const beamUniforms = { time, power: { value: 1 } };

    function configure(root, accept, edit) {
      const copies = new Map();
      root.traverse(object => {
        if (!object.isMesh) return;
        const copy = source => {
          if (!accept(source)) return source;
          if (!copies.has(source)) {
            const material = source.clone();
            copies.set(source, material);
            owned.push(material);
            edit(material);
          }
          return copies.get(source);
        };
        object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material);
      });
    }

    const rings = [1, 2, 3].map(index => node('OrbitalRing_' + index));
    const glass = node('InnerGlass');
    const core = node('CrystalCore');
    const rotor = node('DockRotatingRing');
    const levitation = node('LevitationRoot');
    const luminous = material => material.emissive?.getHex() > 0;
    const track = material => lamps.push([material, material.emissiveIntensity]);

    rings.forEach(ring => configure(ring, luminous, material => {
      track(material);
      addCurrent(material, time, true);
    }));
    configure(node('EnergyElements'), luminous, material => {
      track(material);
      if (material.name === 'Molten light') addCurrent(material, time, false);
    });
    configure(node('DockEnergyV3'), luminous, track);
    configure(rotor, luminous, track);
    configure(glass, () => true, material => {
      material.transmission = 0;
      material.transparent = true;
      material.opacity = 0.29;
      material.depthWrite = false;
    });
    configure(node('AmberFacetedShell'), () => true, material => {
      material.thickness = 0.24;
      material.attenuationDistance = 2.0;
      material.attenuationColor.set('#ffad6d');
    });
    return { model, levitation, rings, glass, core, rotor, baseHeight: levitation.position.y, owned, lamps, time, beamUniforms };
  });

  useEffect(() => {
    // The loaded meshes and the studio environment can settle on different frames.
    const frame = requestAnimationFrame(() => invalidate(3));
    return () => cancelAnimationFrame(frame);
  }, [invalidate, model]);

  useEffect(() => () => owned.forEach(material => material.dispose()), [owned]);

  useFrame((_, delta) => {
    if (!running) return;
    const step = Math.min(delta, 0.05);
    elapsed.current += step;
    const t = elapsed.current;
    const target = phase === 'charging' ? 0.67 : phase === 'releasing' ? 0.96 : 0;
    level.current += (target - level.current) * (1 - Math.exp(-7 * step));
    spin.current += step * (1 + level.current * 0.8) * (phase === 'expanded' ? 0.82 : 1);
    time.value = t;
    const breath = (1 - Math.cos(t * tau / 4.6)) * 0.5;
    const power = 0.83 + breath * 0.31 + level.current * 0.35;
    rings[0].rotation.y = spin.current * tau / 14;
    rings[1].rotation.y = -spin.current * tau / 21;
    rings[2].rotation.y = spin.current * tau / 27;
    glass.rotation.y = -t * tau / 19;
    core.rotation.y = t * tau / 34;
    core.scale.setScalar(1 + breath * 0.041);
    levitation.position.y = baseHeight + Math.sin(t * tau / 6.8) * 0.073;
    rotor.rotation.y = -t * tau / 53;
    lamps.forEach(([material, base]) => { material.emissiveIntensity = base * power; });
    const beamHeight = levitation.position.y - 0.48;
    beam.current.position.y = 0.413 + beamHeight * 0.5;
    beam.current.scale.y = beamHeight;
    beamUniforms.power.value = power;
    light.current.position.y = levitation.position.y;
    light.current.intensity = 5.1 * power;
  });

  return <>
    <primitive object={model} dispose={null} />
    <pointLight ref={light} position={[0, baseHeight, 0]} color="#ff721f" intensity={5.1} distance={3} decay={2} />
    <pointLight position={[0, .53, 0]} color="#ff651c" intensity={1.2} distance={1.6} decay={2} />
    <mesh ref={beam} position={[0, 0.413 + (baseHeight - 0.48) * .5, 0]} scale-y={baseHeight - .48}>
      <cylinderGeometry args={[0.105, 0.255, 1, 28, 1, true]} />
      <shaderMaterial transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending}
        uniforms={beamUniforms} vertexShader={vertex} fragmentShader={energyBeam} />
    </mesh>
    <mesh position={[0, 0.007, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[5.2, 5.2]} />
      <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
        vertexShader={vertex} fragmentShader={pool} />
    </mesh>
  </>;
}

function CinematicEffects() {
  const { gl, scene, camera, size, invalidate, viewport } = useThree();
  const bloom = useRef(null);
  const composite = useRef(null);
  React.useLayoutEffect(() => {
    if (!gl.extensions.has('EXT_color_buffer_float')) return;
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    const screen = new Scene();
    const screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
    screenCamera.position.z = 1;
    const material = new ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { sceneTexture: { value: target.texture }, glowTexture: { value: null }, glowTexel: { value: new Vector2(1, 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D sceneTexture;
        uniform sampler2D glowTexture;
        uniform vec2 glowTexel;
        vec3 safeGlow(vec2 uv) {
          vec3 glow = texture2D(glowTexture, uv).rgb;
          // Preserve the source image when a software renderer returns an invalid blur tap.
          if (any(isnan(glow)) || any(isinf(glow))) return vec3(0.0);
          return clamp(glow, 0.0, 0.7);
        }
        void main() {
          vec3 glow = safeGlow(vUv) * 0.4;
          glow += (safeGlow(vUv + vec2(glowTexel.x,0.0)) + safeGlow(vUv - vec2(glowTexel.x,0.0))
                 + safeGlow(vUv + vec2(0.0,glowTexel.y)) + safeGlow(vUv - vec2(0.0,glowTexel.y))) * 0.15;
          vec3 color = texture2D(sceneTexture, vUv).rgb + glow * 0.70;
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const geometry = new PlaneGeometry(2, 2);
    screen.add(new Mesh(geometry, material));
    bloom.current.initialize(gl, false, HalfFloatType);
    composite.current = { target, screen, screenCamera, material };
    return () => {
      composite.current = null;
      target.dispose();
      material.dispose();
      geometry.dispose();
    };
  }, [gl]);

  React.useLayoutEffect(() => {
    if (!composite.current) return;
    const buffer = gl.getDrawingBufferSize(new Vector2());
    composite.current.target.setSize(buffer.x, buffer.y);
    bloom.current.setSize(buffer.x, buffer.y);
    invalidate();
  }, [gl, invalidate, size.width, size.height, viewport.dpr]);

  useFrame((_, delta) => {
    if (!composite.current) {
      gl.render(scene, camera);
      return;
    }
    const { target, screen, screenCamera, material } = composite.current;
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    bloom.current.update(gl, target, delta);
    const glow = bloom.current.texture;
    material.uniforms.glowTexture.value = glow;
    const { width, height } = glow.image;
    material.uniforms.glowTexel.value.set(1 / width, 1 / height);
    gl.setRenderTarget(null);
    gl.render(screen, screenCamera);
  }, 1);

  return <Bloom ref={bloom} resolutionScale={0.52} luminanceThreshold={0.85} luminanceSmoothing={0.2} />;
}

export default function ReactorCanvas({ running, reduced, controls, fallback, phase, background = '#14151b' }) {
  if (!modelUrl) return fallback;
  return (
    <Canvas camera={{ position: cameraPosition, fov: 36, near: 0.1, far: 40 }} dpr={[1.15, 1.4]}
      frameloop={running ? 'always' : 'demand'} gl={{ antialias: true, alpha: false, stencil: false }}
      fallback={fallback}>
      <ResponsiveLens fixed={!controls} phase={phase} running={running} />
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[4, 5, 4]} color="#fff0dd" intensity={0.98} />
      <directionalLight position={[-4, 1, 3]} color="#b8c7df" intensity={0.72} />
      <directionalLight position={[-3, 3, -4]} color="#ffc08b" intensity={1.65} />
      <Environment resolution={128} frames={1} environmentIntensity={0.72}>
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
      <Reactor running={running} phase={phase} />
      {!(phase && reduced) && <CinematicEffects />}
      {controls && <OrbitControls ref={controls} makeDefault target={cameraTarget}
        minDistance={4.2} maxDistance={12} maxPolarAngle={Math.PI * 0.49}
        enableDamping={!reduced} enablePan={false} />}
    </Canvas>
  );
}
