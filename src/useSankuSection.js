import { useEffect, useState } from 'react';

export function useSankuSection() {
  const [section, setSection] = useState(null);

  useEffect(() => {
    const sections = [...document.querySelectorAll('main > section[id]')];
    let timer;
    let observer;
    let destination;

    function settle() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const line = window.innerHeight * 0.55;
        const dominant = sections.find((element) => {
          const { top, bottom } = element.getBoundingClientRect();
          return top <= line && bottom > line;
        });
        const target = destination && sections.find((element) => element.id === destination.id);
        const targetRect = target?.getBoundingClientRect();
        const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        const targetReached = targetRect && targetRect.bottom > 75 && targetRect.top >= -2 &&
          (targetRect.top <= 150 || (atPageEnd && targetRect.top < line));
        const current = targetReached ? target : dominant;
        if (!current) return;
        if (destination && current.id !== destination.id && performance.now() < destination.until) {
          timer = window.setTimeout(settle, Math.max(0, destination.until - performance.now()));
          return;
        }
        const fromNavigation = destination?.id === current.id;
        destination = null;
        setSection((previous) => previous?.id === current.id ? previous : { id: current.id, fromNavigation });
      }, 140);
    }

    function onNavigate(event) {
      const link = event.target.closest('header.nav a[href^="#"], #home a[href^="#"]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      destination = { id: link.hash.slice(1), until: performance.now() + 1600 };
      settle();
    }

    function observe() {
      observer?.disconnect();
      const line = Math.round(window.innerHeight * 0.55);
      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(settle, {
          rootMargin: '-' + (line - 2) + 'px 0px -' + (window.innerHeight - line - 2) + 'px 0px',
        });
        sections.forEach((element) => observer.observe(element));
      }
      settle();
    }

    document.addEventListener('click', onNavigate);
    window.addEventListener('resize', observe);
    if (typeof IntersectionObserver === 'undefined') window.addEventListener('scroll', settle, { passive: true });
    observe();
    return () => {
      observer?.disconnect();
      window.clearTimeout(timer);
      document.removeEventListener('click', onNavigate);
      window.removeEventListener('resize', observe);
      window.removeEventListener('scroll', settle);
    };
  }, []);

  return section;
}
