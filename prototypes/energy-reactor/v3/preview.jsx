import React, { Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReactorCanvas, { modelUrl, cameraPosition, cameraTarget } from './ReactorCanvas';
import '../preview.css';

class PreviewBoundary extends React.Component {
  state = { message: '' };
  static getDerivedStateFromError(error) { return { message: error.message }; }
  render() {
    return this.state.message
      ? <p role="alert">The 3D preview could not start. {this.state.message}</p>
      : this.props.children;
  }
}

function Preview() {
  const [paused, setPaused] = useState(false);
  const controls = useRef(null);
  const [visible, setVisible] = useState(!document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const pref = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduced(pref.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    pref.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      pref.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  function resetCamera() {
    const control = controls.current;
    if (!control) return;
    const damping = control.enableDamping;
    control.enableDamping = false;
    control.update();
    control.object.position.set(...cameraPosition);
    control.target.set(...cameraTarget);
    control.update();
    control.enableDamping = damping;
  }

  const running = !paused && !reduced && visible;
  return <main>
    <header>
      <div><h1>Energy Reactor V3</h1><p>Molten crystal, three axial orbits, and an energized magnetic dock.</p></div>
      {modelUrl && <div className="controls">
        <button type="button" disabled={reduced} onClick={() => setPaused(value => !value)}>
          {reduced ? 'Reduced motion enabled' : paused ? 'Resume motion' : 'Pause motion'}
        </button>
        <button type="button" onClick={resetCamera}>Reset camera</button>
      </div>}
    </header>
    <section className="studio" aria-label="Reactor model preview">
      {modelUrl ? <PreviewBoundary>
        <Suspense fallback={<p role="status">Loading reactor model...</p>}>
          <ReactorCanvas running={running} reduced={reduced} controls={controls}
            fallback={<p role="status">WebGL is unavailable. Open the exported GLB in Blender to inspect the model.</p>} />
        </Suspense>
      </PreviewBoundary> : <div className="export-status">
        <h2>Waiting for the Blender export</h2>
        <p>Generate <code>reactor-v3.glb</code> in <code>prototypes/energy-reactor/v3/</code>, then reload this page.</p>
        <p>See <code>prototypes/energy-reactor/v3/README.md</code> for the exact command.</p>
      </div>}
    </section>
    {modelUrl && <p className="hint">Drag to orbit. Scroll or pinch to zoom.</p>}
  </main>;
}

createRoot(document.getElementById('reactor-preview')).render(
  import.meta.env.DEV ? <Preview /> : <p>This prototype is available only through the Vite development server.</p>,
);
