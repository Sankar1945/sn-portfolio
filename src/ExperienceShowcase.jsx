import React, { useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { Reveal, RevealPart } from './PortfolioMotion';
import SectionConnector from './SectionConnector';
import './experience-showcase.css';

const company = 'Power Centre Private Limited';
const technologies = [
  'Microsoft Copilot Studio', 'Power Automate', 'AI Agents', 'Microsoft Power Platform',
  'API Integrations', 'Microsoft Foundry', 'Microsoft Power Apps', 'SharePoint',
];

function CompanyIdentity() {
  const panel = useRef(null);
  const visible = useInView(panel);
  const [logoFailed, setLogoFailed] = useState(false);

  return <Reveal className="experience-showcase__identity" delay={0.06}>
    <div ref={panel} className="experience-showcase__stage" data-visible={visible}>
      <div className="experience-showcase__halo" aria-hidden="true" />
      <div className="experience-showcase__orbit experience-showcase__orbit--blue" aria-hidden="true" />
      <div className="experience-showcase__orbit experience-showcase__orbit--lime" aria-hidden="true" />
      <div className="experience-showcase__sweep" aria-hidden="true" />
      <div className="experience-showcase__logo">
        {logoFailed ? <strong>{company}</strong> : (
          <img src="/assets/skills/power-centre-dark.png" alt={company + ' logo. Bringing our Expertise to Your Business'}
            width={470} height={150} loading="lazy" decoding="async" onError={() => setLogoFailed(true)} />
        )}
      </div>
    </div>
  </Reveal>;
}

export default function ExperienceShowcase() {
  const section = useRef(null);
  React.useLayoutEffect(() => {
    if (window.location.hash === '#experience') section.current.scrollIntoView({ behavior: 'instant' });
  }, []);

  return <section ref={section} id="experience" className="section experience-showcase" aria-labelledby="experience-title">
    <SectionConnector />
    <Reveal as="header" className="experience-showcase__intro" effect="group" stagger={0.1}>
      <RevealPart className="eyebrow" effect="fade">PROFESSIONAL EXPERIENCE / 01</RevealPart>
      <RevealPart as="h2" className="sectionTitle" id="experience-title">Where I <span>Work.</span></RevealPart>
      <RevealPart as="p" className="subhead">Building intelligent automation solutions.</RevealPart>
    </Reveal>
    <div className="experience-showcase__grid">
      <CompanyIdentity />
      <Reveal as="article" className="experience-showcase__role" delay={0.18} effect="group" stagger={0.1}>
        <RevealPart effect="rise">
          <p className="experience-showcase__status">Current role</p>
          <h3>Copilot Trainee</h3>
          <p className="experience-showcase__company">{company}</p>
          <p className="experience-showcase__period"><time dateTime="2026-06">June 2026</time>{' \u2014 Present'}</p>
        </RevealPart>
        <RevealPart as="p" className="experience-showcase__description">
          Building intelligent automation solutions using Microsoft Copilot Studio, Power Automate, and API integrations to connect business systems and streamline workflows.
        </RevealPart>
        <ul className="experience-showcase__tags" aria-label="Technologies">
          {technologies.map(technology => <li key={technology}>{technology}</li>)}
        </ul>
      </Reveal>
    </div>
  </section>;
}
