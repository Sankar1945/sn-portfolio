import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, MessageSquare, Mail, Linkedin, Download } from 'lucide-react';
import AutomationLab from './AutomationLab';
import FloatingHeader from './FloatingHeader';
import WorkflowAtmosphere from './WorkflowAtmosphere';
import Sanku from './Sanku';
import CinematicIntro, { shouldShowIntro } from './CinematicIntro';
import Toolkit from './Toolkit';
import PortraitReveal from './PortraitReveal';
import ProjectsShowcase from './ProjectsShowcase';

import ExperienceShowcase from './ExperienceShowcase';
import Certifications from './Certifications';
import SectionConnector from './SectionConnector';
import { HeroCopy, PortfolioMotion, Reveal, RevealPart } from './PortfolioMotion';
import './style.css';
import './cinematic-ui.css';
import './portfolio-v4.css';
import './contact.css';
import './about-actions.css';
import './portfolio-typography.css';
import './section-contours.css';

function App(){
  const [explanation, setExplanation] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [intro, setIntro] = useState(() => shouldShowIntro() ? 'playing' : 'bypassed');
  const clearExplanation = useCallback(() => setExplanation(null), []);
  const exitIntro = useCallback((reason) => setIntro(reason), []);
  return <><FloatingHeader /><main><section id="home" className="hero section"><WorkflowAtmosphere shared /><HeroCopy><h1>Sankara<br /><span>Narayanan T</span></h1><h2>AI & Intelligent Automation Developer</h2><div className="motto">THINK. <em>BUILD.</em> EVOLVE.</div><p>Turning ideas into intelligent solutions through automation, AI and software development.</p><div className="buttons"><a className="primary edge-light" href="#projects">Explore Projects <ArrowUpRight size={17}/></a><a className="secondary edge-light" href="#contact"><MessageSquare size={16} aria-hidden="true"/>Let's Connect</a></div></HeroCopy><AutomationLab /></section>
<PortraitReveal>
  <SectionConnector />
  <Reveal effect="group" stagger={0.16}>
    <RevealPart className="eyebrow" effect="fade">ABOUT ME</RevealPart>
    <RevealPart as="h2" className="sectionTitle" effect="group" stagger={0.16}>
      <RevealPart as="span" className="about-leading-line">Curiosity drives me.</RevealPart><br/>
      <RevealPart as="span" className="about-title-line">Building defines me.</RevealPart>
    </RevealPart>
    <RevealPart className="about-reveal-rule reveal-decoration" effect="draw" aria-hidden="true" />
  </Reveal>
  <Reveal as="p" className="intro" delay={0.36}>I'm Sankara Narayanan T., an AI & Intelligent Automation Developer focused on building smart workflows, AI agents, and practical digital solutions. I enjoy exploring new technologies, turning ideas into working solutions, and continuously learning through hands-on development.</Reveal>
  <Reveal className="about-actions" effect="group" stagger={0.12} onPointerUp={(event) => event.stopPropagation()}>
    <RevealPart as="a" className="primary resume-download-btn" href="/resume/Sankara_Narayanan_Resume.pdf" download="Sankara_Narayanan_Resume.pdf">
      <Download size={18} aria-hidden="true" /> Download Resume
    </RevealPart>
    <RevealPart as="button" type="button" className="secondary"
      aria-expanded={explanation?.about === true}
      aria-controls={explanation?.about ? 'sanku-message' : undefined}
      onClick={(event) => setExplanation({
        about: true,
        name: 'Your portfolio guide',
        source: event.currentTarget,
      })}>
      <MessageSquare size={18} aria-hidden="true" /> Meet Sanku
    </RevealPart>
  </Reveal>
</PortraitReveal>
<Toolkit selected={explanation} onExplain={setExplanation} />
<ExperienceShowcase />
<ProjectsShowcase selected={explanation} onExplore={setExplanation} activeProject={activeProject} onActiveProject={setActiveProject} />
<Certifications enabled={intro !== 'playing'} />
<section id="contact" className="section contact">
  <SectionConnector />
  <Reveal className="contact-reveal" effect="group" stagger={0.12} viewport={{ amount: 0.15, margin: '-75px 0px 0px' }}>
    <RevealPart className="contact-reveal-glow reveal-decoration" effect="glow" aria-hidden="true" />
    <svg className="contact-orbits" viewBox="0 0 360 220" aria-hidden="true" focusable="false">
      <g transform="translate(180 110) rotate(-23) scale(1 .44)">
        <circle r="145" />
        <circle r="112" opacity=".55" />
        <g className="contact-orbits__traveler">
          <circle className="contact-orbits__point" cx="145" r="3.7" />
        </g>
      </g>
      <ellipse cx="180" cy="110" rx="128" ry="47" transform="rotate(19 180 110)" opacity=".36" />
    </svg>
    <RevealPart className="eyebrow" effect="fade">GET IN TOUCH</RevealPart>
    <RevealPart as="h2" className="sectionTitle">Have an idea?<br/><span>Let's make it happen.</span></RevealPart>
    <RevealPart as="p" className="subhead">Interested in AI, automation or building something meaningful? I'd love to connect.</RevealPart>
    <RevealPart className="buttons" effect="group" stagger={0.12}>
      <RevealPart as="a" className="primary" href="mailto:narayanansankara14@gmail.com">
        <Mail size={18} aria-hidden="true" /> Send an Email
      </RevealPart>
      <RevealPart as="a" className="secondary" href="https://www.linkedin.com/in/sankara-narayanan-t-61649a335/" target="_blank" rel="noreferrer">
        <Linkedin size={18} aria-hidden="true" /> LinkedIn
      </RevealPart>
    </RevealPart>
  </Reveal>
</section></main>
<footer className="site-footer">© 2026 Sankara Narayanan T. <span>Think. Build. Evolve.</span></footer>
{intro === 'playing' ? <CinematicIntro onExit={exitIntro} /> :
  <Sanku activeProject={activeProject} cinematicArrival={intro === 'completed'} explanation={explanation} clearExplanation={clearExplanation} />}</>};createRoot(document.getElementById('root')).render(<PortfolioMotion><App /></PortfolioMotion>);
