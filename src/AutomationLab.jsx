import React, { Fragment, lazy, Suspense, useEffect, useMemo, useState } from 'react';
import ActiveProcessLabel from './ActiveProcessLabel';
import { FileText, Headphones, Layers3, Pause, Play, RotateCcw, UserRoundPlus } from 'lucide-react';
import { workflows } from './workflows';
import './workflow-scene.css';

const WorkflowScene = lazy(() => import('./WorkflowScene'));

const travelDuration = 1050;
const motionQuery = '(prefers-reduced-motion: reduce)';
const selectors = [
  { label: 'Invoice Processing', Icon: FileText },
  { label: 'Employee Onboarding', Icon: UserRoundPlus },
  { label: 'AI Support Routing', Icon: Headphones },
];

class SceneLoadBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function AutomationLab() {
  const [reduced, setReduced] = useState(() => window.matchMedia(motionQuery).matches);
  const [playing, setPlaying] = useState(() => !window.matchMedia(motionQuery).matches);
  const [position, setPosition] = useState({ flowIndex: 0, step: 0 });
  const timeline = useMemo(() => ({ elapsed: 0, started: null }), [position]);
  const [preview, setPreview] = useState(null);
  const [viewReset, setViewReset] = useState(0);
  const { flowIndex, step } = position;
  const flow = workflows[flowIndex];
  const hasNext = step < flow.nodes.length - 1;
  const holdDuration = Math.max(3000, flow.nodes[step][1].length * 36);
  const duration = holdDuration + (hasNext && !reduced ? travelDuration : 0);

  useEffect(() => {
    const preference = window.matchMedia(motionQuery);
    const update = (event) => {
      setReduced(event.matches);
      if (event.matches) setPlaying(false);
    };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    timeline.started = performance.now();
    const timer = window.setTimeout(() => {
      if (!hasNext) setPreview(null);
      setPosition(hasNext
        ? { flowIndex, step: step + 1 }
        : { flowIndex: (flowIndex + 1) % workflows.length, step: 0 });
    }, Math.max(0, duration - timeline.elapsed));
    return () => {
      window.clearTimeout(timer);
      timeline.elapsed += performance.now() - timeline.started;
      timeline.started = null;
    };
  }, [playing, flowIndex, step, hasNext, duration, timeline]);

  function inspect(index) {
    setPreview(null);
    setPosition({ flowIndex, step: index });
  }

  function selectWorkflow(index) {
    setPreview(null);
    setPosition({ flowIndex: index, step: 0 });
  }

  const [name, description] = flow.nodes[step];

  const fallback = (
    <div className="workflow-fallback">
      <div className="network" role="group" aria-label={flow.name + ' steps'}>
        {flow.nodes.map(([label], index) => (
          <Fragment key={label}>
            {index > 0 && <div className={index <= step ? 'wire lit' : 'wire'} aria-hidden="true" />}
            <button type="button" className={`node ${index === step ? 'active' : index < step ? 'done' : ''}`}
              aria-pressed={index === step} aria-describedby="workflow-description" onClick={() => inspect(index)}>
              <span className="nodeindex" aria-hidden="true">{index + 1}</span>
              <strong>{label}</strong>
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <section className="workflow-lab" aria-labelledby="lab-title">
      <div className="labtop">
        <div className="workflow-heading">
          <span className="workflow-heading__icon"><Layers3 size={22} aria-hidden="true" /></span>
          <div>
            <h2 id="lab-title" className="eyebrow">Automation Lab</h2>
            <p className="workflow-simulation">Select a workflow. Watch it come alive.</p>
          </div>
        </div>
        <div className="workflow-actions" aria-label="Playback controls" role="group">
          <button className="workflow-reset" type="button" aria-label="Restart workflow" title="Restart workflow"
            onClick={() => {
              selectWorkflow(flowIndex);
              setViewReset((current) => current + 1);
            }}>
            <RotateCcw size={15} aria-hidden="true" />
            <span>Restart</span>
          </button>
          <button type="button" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
            {playing ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
      <div className="workflow-selectors" role="group" aria-label="Select a workflow">
        {selectors.map(({ label, Icon }, index) => {
          const selected = flowIndex === index;
          return (
            <button key={label} type="button" aria-pressed={selected}
              aria-label={workflows[index].name} title={workflows[index].name}
              onClick={() => selectWorkflow(index)}>
              <span className="workflow-selector__icon"><Icon size={15} aria-hidden="true" /></span>
              <span className="workflow-selector__name">{label}</span>
              {selected && (
                <span className="workflow-selector__stages" aria-hidden="true">
                  {flow.nodes.map(([node], nodeIndex) => (
                    <span key={node} data-status={nodeIndex === step ? 'current' : nodeIndex < step ? 'complete' : 'pending'} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <SceneLoadBoundary fallback={fallback}>
        <Suspense fallback={null}>
          <WorkflowScene fallback={fallback}
            step={step} flowIndex={flowIndex} playing={playing} reduced={reduced}
            inspect={inspect} preview={preview} onPreview={setPreview} timeline={timeline} holdDuration={holdDuration} travelDuration={travelDuration} viewReset={viewReset} />
        </Suspense>
      </SceneLoadBoundary>
        <ActiveProcessLabel name={name} description={description} playing={playing} />
        <div className="workflow-progress" role="group" aria-label="Inspect a process step">
          {flow.nodes.map(([label, explanation], index) => (
            <button key={label} type="button" aria-label={label + ': ' + explanation}
              aria-current={step === index ? 'step' : undefined}
              onFocus={() => setPreview(index)} onBlur={() => setPreview(null)}
              onMouseEnter={() => setPreview(index)} onMouseLeave={(event) => {
                if (document.activeElement !== event.currentTarget) setPreview(null);
              }}
              onClick={() => inspect(index)}>
              <span aria-hidden="true">{index + 1}</span>
            </button>
          ))}
        </div>
    </section>
  );
}
