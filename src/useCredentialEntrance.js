import { useEffect, useRef, useState } from 'react';

export function useCredentialEntrance(cards, reduced, enabled) {
  const [playing, setPlaying] = useState(false);
  const [settled, setSettled] = useState(false);
  const run = useRef({ active: false, armed: true, ended: -Infinity, frame: null });

  function startTimeline(event) {
    const state = run.current;
    const animation = event.currentTarget.getAnimations().find((item) => item.animationName === 'credential-entry');
    if (!state.active || !animation) return;
    window.cancelAnimationFrame(state.frame);
    const token = {};
    cards.current.dispatchEvent(new CustomEvent('certifications-rise', { bubbles: true, detail: token }));
    function check() {
      state.frame = null;
      if (!state.active || animation.playState === 'idle') return;
      if (typeof animation.currentTime === 'number' && animation.currentTime >= 800) {
        if (animation.currentTime < 2000) {
          cards.current.dispatchEvent(new CustomEvent('certifications-split', { bubbles: true, detail: token }));
        }
        return;
      }
      state.frame = window.requestAnimationFrame(check);
    }
    state.frame = window.requestAnimationFrame(check);
  }

  function finish() {
    if (!run.current.active) return;
    run.current.active = false;
    run.current.ended = performance.now();
    setSettled(true);
    window.cancelAnimationFrame(run.current.frame);
    run.current.frame = null;
  }

  useEffect(() => {
    const target = cards.current;
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    let enter;
    let leave;
    let enough = false;
    const observer = new IntersectionObserver(([entry]) => {
      enough = entry.intersectionRect.height >= Math.min(entry.boundingClientRect.height * .55, window.innerHeight * .55);
      if (!entry.isIntersecting) {
        if (leave === undefined) {
          leave = window.setTimeout(() => {
            leave = undefined;
            run.current.active = false;
            window.cancelAnimationFrame(run.current.frame);
            run.current.frame = null;
            run.current.armed = true;
            setPlaying(false);
            setSettled(false);
          }, 850);
        }
      } else {
        window.clearTimeout(leave);
        leave = undefined;
      }
      if (!enough) {
        window.clearTimeout(enter);
        enter = undefined;
      } else if (enter === undefined && run.current.armed) {
        enter = window.setTimeout(() => {
          enter = undefined;
          if (!enough || !run.current.armed) return;
          run.current.armed = false;
          run.current.active = true;
          if (reduced) finish();
          else setPlaying(true);
        }, Math.max(180, 1800 - (performance.now() - run.current.ended)));
      }
    }, { rootMargin: '-72px 0px -24px 0px', threshold: Array.from({ length: 41 }, (_, i) => i / 40) });
    observer.observe(target);
    if (reduced && run.current.active) finish();
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(run.current.frame);
      run.current.frame = null;
      window.clearTimeout(enter);
      window.clearTimeout(leave);
    };
  }, [cards, reduced, enabled]);

  return { playing, settled, startTimeline, finish };
}
