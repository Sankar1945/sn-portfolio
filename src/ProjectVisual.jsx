import React, { useRef } from 'react';
import { useInView } from 'motion/react';
import ProjectWorkflow from './ProjectWorkflow';

const projectImages = {
  timesheet: {
    src: '/projects/timesheet-3d.png',
    alt: '3D visualization of an intelligent automation workflow connecting conversational AI, automation, data storage and reporting.',
  },
  lex: {
    src: '/projects/lex-car-3d.png',
    alt: '3D automotive showroom visualization with a conversational car-ordering interface.',
  },
};

function OnboardingVisual() {
  return (
    <div className="projectvisual project-scene">
      <img className="project-hr-image"
        src="/projects/fd7b3d4c-121d-4873-a9b7-f99776e86c94.png"
        alt="HR onboarding workflow from Microsoft Entra ID events through Power Automate, global and regional sessions, and an onboarding agenda email."
        width={1672} height={941} loading="lazy" decoding="async" />
    </div>
  );
}

function Mascot() {
  return (
    <svg viewBox="0 0 620 400">
      <defs>
        <linearGradient id="mascot-shell" x2=".6" y2="1">
          <stop stopColor="#243760"/><stop offset=".56" stopColor="#141a34"/><stop offset="1" stopColor="#080e1c"/>
        </linearGradient>
      </defs>
      <ellipse cx="310" cy="311" rx="197" ry="34" fill="#111a34" stroke="#527ba6"/>
      <ellipse cx="310" cy="309" rx="155" ry="19" fill="#0c1328" stroke="#4f50a5"/>
      <g className="project-hologram">
        <path d="M207 237V128l103-52 103 52v109l-103 54Z" fill="url(#mascot-shell)" stroke="#80b7e7" strokeWidth="2"/>
        <path d="m207 128 103 55 103-55m-103 55v108m-71-100 46 23m52 16 40-20" fill="none" stroke="#648ac9"/>
        <path d="M180 151v-39h36m224 39v-39h-36m-224 92v39h36m224-39v39h-36" fill="none" stroke="#72d8ff" strokeWidth="2"/>
      </g>
      <path className="project-scanner" d="M178 160h264" stroke="#79dbff" strokeWidth="2"/>
      <path d="M95 173h52m-43 12h24m346 12h53m-34 12h43M99 262h39m351-13h33" stroke="#5985bd" opacity=".52"/>
      <text className="project-restricted" x="310" y="366" style={{ fill: "var(--signature-light)" }} fontSize="15" textAnchor="middle" letterSpacing="4">ACCESS RESTRICTED</text>
    </svg>
  );
}

function MascotVisual({ active }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3 });
  return (
    <div ref={ref} className="projectvisual project-scene project-scene--mascot"
      aria-hidden="true" data-animate={active && inView}>
      <Mascot />
    </div>
  );
}

export default function ProjectVisual({ id, active }) {
  if (id === 'hr-onboarding') return <OnboardingVisual />;
  const image = projectImages[id];
  if (!image) return <MascotVisual active={active} />;

  return (
    <div className={'projectvisual project-workflow-visual project-workflow-visual--' + id}>
      <div className="project-image">
        <img {...image} width={1448} height={1086} loading="lazy" decoding="async" />
      </div>
      <ProjectWorkflow id={id} />
    </div>
  );
}
