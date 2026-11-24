import React, { useId, useLayoutEffect, useRef, useState } from 'react';

const timesheetSteps = [
  ['Employee Submission', 'Employees provide timesheet details through a guided Adaptive Card.'],
  ['Copilot Studio', 'The conversational agent guides employees to the questions for their department.'],
  ['Power Automate', 'Workflows check submissions and coordinate reminders and escalation.'],
  ['SharePoint Storage', 'SharePoint stores activity records for the workflow to retrieve.'],
  ['Compliance Reporting', 'Excel reports summarize submissions and highlight outstanding entries.'],
];

const lexSteps = [
  ['Customer Request', 'The customer starts a conversation to request a car.'],
  ['Amazon Lex', "Amazon Lex interprets the customer's request and guides the conversation."],
  ['Collect Details', 'The chatbot gathers customer information and vehicle preferences.'],
  ['Confirm Order', 'The customer reviews the captured details before confirming the request.'],
  ['Order Summary', 'The chatbot summarizes the request and provides confirmation.'],
];

export default function ProjectWorkflow({ id }) {
  const steps = id === 'lex' ? lexSteps : timesheetSteps;
  const detail = useId();
  const row = useRef(null);
  const [chosen, setChosen] = useState(0);
  const [preview, setPreview] = useState(null);
  const current = preview ?? chosen;

  useLayoutEffect(() => {
    const element = row.current;
    const button = element.children[current];
    const update = () => {
      element.style.setProperty('--stage-x', button.offsetLeft + 'px');
      element.style.setProperty('--stage-width', button.offsetWidth + 'px');
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(button);
    update();
    return () => observer.disconnect();
  }, [current]);

  return (
    <div className="project-workflow" onPointerLeave={() => setPreview(null)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null); }}>
      <div className="project-workflow__scroll">
      <div ref={row} className="project-workflow__steps" role="group"
        aria-label={id === 'lex' ? 'AWS Lex workflow steps' : 'Timesheet workflow steps'}>
        {steps.map(([label], index) => (
          <button key={label} type="button" aria-controls={detail} aria-pressed={chosen === index}
            data-preview={current === index}
            onPointerEnter={(event) => { if (id === 'timesheet' && event.pointerType === 'mouse') setPreview(index); }}
            onFocus={() => { if (id === 'timesheet') setPreview(index); }}
            onClick={() => { setChosen(index); setPreview(null); }}>
            {label}
          </button>
        ))}
        <span className="project-workflow__indicator" aria-hidden="true" />
      </div>
      </div>
      <div className="project-workflow__progress" aria-hidden="true">
        <span style={{ transform: 'scaleX(' + (current + 1) / steps.length + ')' }} />
      </div>
      <p id={detail} aria-live="polite"><span key={current}>{steps[current][1]}</span></p>
    </div>
  );
}
