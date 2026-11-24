import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import './floating-header.css';

const sections = ['Home', 'About', 'Skills', 'Experience', 'Projects', 'Certifications', 'Contact'];
const ids = sections.map((label) => label.toLowerCase());
const desktopQuery = '(min-width: 880px)';

function Monogram({ onNavigate }) {
  return (
    <a href="#home" className="floating-header__brand" aria-label="Sankara Narayanan T — Back to Home" onClick={onNavigate}>
      <span className="floating-header__signature" aria-hidden="true">
        <span className="floating-header__letters">SN</span>
        <span className="floating-header__cursor" />
      </span>
    </a>
  );
}

function useHeaderScroll(header) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(() => {
    const hash = window.location.hash.slice(1);
    return ids.includes(hash) ? hash : 'home';
  });

  useEffect(() => {
    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
    let frame = 0;
    function update() {
      frame = 0;
      setScrolled(window.scrollY >= 80);
      const root = document.documentElement;
      const bottom = window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2;
      const readingLine = Math.max(header.current.getBoundingClientRect().bottom + 25,
        Math.min(window.innerHeight * 0.24, 185));
      const visible = targets.findLast((element) => element.getBoundingClientRect().top <= readingLine);
      // On tall screens the final anchors can resolve to the same scroll position.
      const atRequestedSection = visible && window.location.hash === '#' + visible.id;
      setActive((bottom && !atRequestedSection ? targets.at(-1) : visible)?.id ?? 'home');
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const observer = new ResizeObserver(schedule);
    targets.forEach((section) => observer.observe(section));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, [header]);

  return { active, scrolled };
}

export default function FloatingHeader() {
  const header = useRef(null);
  const nav = useRef(null);
  const toggle = useRef(null);
  const [open, setOpen] = useState(false);
  const { active, scrolled } = useHeaderScroll(header);

  useLayoutEffect(() => {
    const element = nav.current;
    const link = element.querySelector('[aria-current="location"]');
    if (!link) return;
    function measure() {
      element.style.setProperty('--underline-x', link.offsetLeft + 'px');
      element.style.setProperty('--underline-width', link.offsetWidth + 'px');
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(link);
    measure();
    return () => observer.disconnect();
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    nav.current.querySelector('a')?.focus({ preventScroll: true });
    const desktop = window.matchMedia(desktopQuery);
    const onResize = () => { if (desktop.matches) setOpen(false); };
    function onOutside(event) {
      if (!header.current.contains(event.target)) setOpen(false);
    }
    function onEscape(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setOpen(false);
      toggle.current.focus();
    }
    desktop.addEventListener('change', onResize);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      desktop.removeEventListener('change', onResize);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <>
      <header ref={header} className="nav floating-header" data-scrolled={scrolled}>
        <Monogram onNavigate={() => setOpen(false)} />
        <nav ref={nav} id="portfolio-nav" className="floating-header__links" aria-label="Portfolio navigation" data-open={open}>
          {sections.map((label, index) => (
            <a key={label} className={label === 'Contact' ? 'floating-header__mobile-contact' : undefined} href={'#' + ids[index]} aria-current={active === ids[index] ? 'location' : undefined}
              onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>
        <a className="floating-header__contact" href="#contact" aria-label="Go to Contact section">
          Contact <ArrowUpRight size={17} aria-hidden="true" />
        </a>
        <button ref={toggle} type="button" className="floating-header__menu"
          aria-expanded={open} aria-controls="portfolio-nav" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen(!open)}>
          {open ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </header>
      <div className="floating-header-space" aria-hidden="true" />
    </>
  );
}
