import React, { useEffect, useRef, useState } from 'react';
import { m, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import ProjectVisual from './ProjectVisual';
import { SectionIntro } from './PortfolioMotion';
import SectionConnector from './SectionConnector';

const projects = [
  {
    id: 'hr-onboarding', label: '01 / ENTERPRISE AUTOMATION / WORKFLOW ARCHITECTURE', title: 'HR Onboarding Flow',
    description: 'An event-driven onboarding workflow architecture that connects employee validation, global session creation and region-specific agenda planning through Microsoft automation technologies.',
    tags: ['Microsoft Power Automate', 'Microsoft Entra ID', 'Webhooks', 'SharePoint', 'Microsoft 365'],
  },
  {
    id: 'timesheet', label: '02 / FEATURED PROJECT', title: 'Intelligent Timesheet Management & Workforce Automation Solution',
    description: 'An end-to-end solution that collects employee activities through a conversational agent, checks submissions, automates follow-ups, and produces workforce reports.',
    tags: ['Microsoft Copilot Studio', 'Power Automate', 'Adaptive Cards', 'Microsoft Teams', 'Microsoft 365 Copilot Chat', 'SharePoint', 'Microsoft Excel'],
  },
  {
    id: 'lex', label: '03 / CONVERSATIONAL AI', title: 'AWS Lex Car Ordering Chatbot',
    description: 'Built with Amazon Lex to simulate car orders, collect customer details, capture preferences and confirm requests.',
    tags: ['Amazon Lex', 'AWS'],
  },
  {
    id: 'mascot', label: '04 / Classified Personal Project', title: 'Project MASCOT',
    headline: 'Something is taking shape. Stay tuned.',
    description: 'Not everything is meant to be revealed just yet. A personal experiment is evolving behind the scenes.',
    tags: ['CLASSIFIED', 'EXPERIMENTAL', 'IN DEVELOPMENT'],
  },
];

const desktopQuery = '(min-width: 1001px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)';
const stops = [0, 0.09, 0.36, 0.63, 0.9, 1];
const sequence = [0, 0, 1, 2, 3, 3];

function ProjectPanel({ project, index, progress, active, pinned, selected, onExplore, sankuActive }) {
  const { title, label, headline, description, tags } = project;
  const panel = useRef(null);
  const y = useTransform(progress, (value) => {
    const incoming = Math.min(1, Math.max(0, index - value));
    const outgoing = Math.max(0, value - index);
    // Mix smoothstep with linear progress so the card eases without stalling.
    const rise = incoming * 0.6 + incoming ** 2 * (3 - 2 * incoming) * 0.4;
    return (105 * rise - 3 * outgoing) + '%';
  });
  const scale = useTransform(progress, (value) => 1 - Math.max(0, value - index) * 0.03);
  const visibility = useTransform(progress, (value) =>
    index - value >= 1 ? 'hidden' : 'visible');
  useEffect(() => { panel.current.inert = pinned && !active; }, [pinned, active]);

  return (
    <m.article ref={panel} className="project showcase-panel" data-project-id={project.id} data-sanku-active={sankuActive}
      aria-hidden={pinned && !active || undefined}
      style={pinned ? { y, scale, visibility, zIndex: index + 1 } : { y: 0, scale: 1, visibility: 'visible', zIndex: 'auto' }}>
      <div className="projectbody">
        <small>{label}</small>
        <h3>{title}</h3>
        {headline && <strong className="project-headline">{headline}</strong>}
        <p>{description}</p>
        <div className="tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <button type="button" className="skill-explain project-explore edge-light"
          aria-label={'Explore ' + title + ' with Sanku'}
          aria-expanded={selected}
          aria-controls={selected ? 'sanku-project-message' : undefined}
          onClick={(event) => {
            if (!pinned || active) onExplore({ project: project.id, name: title, source: event.currentTarget });
          }}>
          <MessageSquare size={15} aria-hidden="true" /> Explore with Sanku
        </button>
      </div>
      <ProjectVisual id={project.id} active={!pinned || active} />
    </m.article>
  );
}

export default function ProjectsShowcase({ selected, onExplore, activeProject, onActiveProject }) {
  const run = useRef(null);
  const lastProject = useRef(null);
  const [pinned, setPinned] = useState(() => window.matchMedia(desktopQuery).matches);
  const [active, setActive] = useState(0);
  const { scrollY, scrollYProgress } = useScroll({ target: run, offset: ['start 82px', 'end end'] });
  const progress = useTransform(scrollYProgress, stops, sequence);
  useMotionValueEvent(progress, 'change', (value) => setActive(Math.floor(value + 0.45)));

  function reportProject(id) {
    if (lastProject.current === id) return;
    lastProject.current = id;
    onActiveProject(id);
  }

  function updateActiveProject() {
    const line = window.innerHeight * .55;
    const bounds = run.current.getBoundingClientRect();
    if (line < bounds.top || line >= bounds.bottom) {
      reportProject(null);
      return;
    }
    if (pinned) {
      reportProject(projects[active].id);
      return;
    }
    const card = Array.from(run.current.querySelectorAll('[data-project-id]')).find((element) => {
      const { top, bottom } = element.getBoundingClientRect();
      return top <= line && bottom > line;
    });
    reportProject(card?.dataset.projectId ?? null);
  }

  useMotionValueEvent(scrollY, 'change', updateActiveProject);
  useEffect(() => {
    updateActiveProject();
    window.addEventListener('resize', updateActiveProject);
    return () => window.removeEventListener('resize', updateActiveProject);
  }, [active, pinned, onActiveProject]);

  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const update = () => setPinned(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <section id="projects" className="section">
      <SectionConnector />
      <SectionIntro><div className="eyebrow">SELECTED WORK</div><h2 className="sectionTitle">Things I've <span>Built.</span></h2></SectionIntro>
      <p className="subhead">A few projects that turned ideas into working solutions.</p>
      <div ref={run} className="project-showcase" data-pinned={pinned} data-active={active + 1} data-active-project={pinned ? projects[active].id : undefined}>
        <div className="showcase-stack">
          {projects.map((project, index) => (
            <ProjectPanel key={project.id} project={project} progress={progress}
              index={index} active={active === index} pinned={pinned}
              selected={selected?.project === project.id} onExplore={onExplore} sankuActive={activeProject === project.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
