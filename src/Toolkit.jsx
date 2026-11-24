import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Check, ChevronRight, Sparkles } from 'lucide-react';
import { AnimatePresence, m, useIsPresent, useReducedMotion } from 'motion/react';
import { skills } from './toolkitSkills';
import { skillExplanations } from './sankuSkills';
import SectionConnector from './SectionConnector';
import './toolkit-scene.css';

const DetailCopy = React.forwardRef(function DetailCopy({ category, technology }, ref) {
  const isPresent = useIsPresent();
  const reduced = useReducedMotion();
  return <m.div ref={ref} className="skills-keyboard__detail-copy" aria-hidden={!isPresent}
    initial={reduced ? false : { opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? 0 : .27, ease: 'easeOut' }}>
    <span className="skills-keyboard__badge">{category}</span>
    <h3>{technology.name}</h3>
    <p>{technology.description}</p>
    <div className="skills-keyboard__accent" aria-hidden="true" />
    <h4>{technology.project ? 'How I Use It' : 'Practical Uses'}</h4>
    <p>{technology.application}</p>
    {technology.project && <p className="skills-keyboard__project">{technology.project}</p>}
  </m.div>;
});

function TechnologyDetail({ category, technology, selected, onExplain }) {
  const text = skillExplanations[technology.name];
  return <aside className="skills-keyboard__detail" id="selected-technology" aria-label="Selected technology" tabIndex={-1} data-keyboard-reveal>
    <p className="skills-keyboard__kicker">Selected Technology</p>
    <div className="skills-keyboard__detail-stage" aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false} mode="popLayout">
        <DetailCopy key={technology.name} category={category} technology={technology} />
      </AnimatePresence>
    </div>
    <div className="toolkit-actions">
      <button className="skill-explain skills-keyboard__explain" type="button"
        aria-label={'Ask Sanku about ' + technology.name}
        aria-pressed={selected?.name === technology.name}
        onClick={event => onExplain({ name: technology.name, text, source: event.currentTarget })}>
        <Sparkles size={15} aria-hidden="true" /> Ask Sanku
      </button>
    </div>
  </aside>;
}

export default function Toolkit({ selected, onExplain }) {
  const section = useRef(null);
  const [selection, setSelection] = useState({ row: 0, key: 0 });
  const category = skills[selection.row];
  const technology = category.items[selection.key];

  React.useLayoutEffect(() => {
    if (window.location.hash === '#skills') section.current.scrollIntoView({ behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.setAttribute('data-entered', '');
        observer.unobserve(target);
      }
    }, { threshold: .12, rootMargin: '0px 0px -35px' });
    section.current.querySelectorAll('[data-keyboard-reveal]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return <section id="skills" className="section" ref={section} aria-labelledby="toolkit-title">
    <SectionConnector />
    <header className="skills-keyboard__header" data-keyboard-reveal>
      <p className="skills-keyboard__kicker">Capabilities / 04 Disciplines</p>
      <h2 className="sectionTitle" id="toolkit-title">My Digital <span>Toolkit</span></h2>
      <p className="subhead">The technologies I use to build intelligent, connected solutions.</p>
    </header>
    <div className="skills-keyboard">
      <div className="skills-keyboard__board">
        <a className="skills-keyboard__jump" href="#selected-technology">
          <span>View details for {technology.name}</span><ArrowDown size={15} aria-hidden="true" />
        </a>
        {skills.map(({ name, icon: Icon, items }, row) => (
          <div className="skills-keyboard__row" key={name} data-keyboard-reveal
            data-active={row === selection.row} style={{ '--discipline-delay': row * 55 + 'ms' }}>
            <h3><Icon size={16} aria-hidden="true" />{name}</h3>
            <div className="skills-keyboard__keys" role="group" aria-label={name + ' technologies'}>
              {items.map(({ name: label }, key) => {
                const pressed = row === selection.row && key === selection.key;
                return <button key={label} type="button" aria-pressed={pressed}
                  style={{ '--key-delay': 45 + key * 32 + 'ms' }}
                  onClick={() => { if (!pressed) setSelection({ row, key }); }}>
                  <span>{label}</span>
                  {pressed ? <Check size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                </button>;
              })}
            </div>
          </div>
        ))}
      </div>
      <TechnologyDetail category={category.name} technology={technology} selected={selected} onExplain={onExplain} />
    </div>
  </section>;
}
