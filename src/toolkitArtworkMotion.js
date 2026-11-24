import { useLayoutEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import gsap from 'gsap';

export function useToolkitArtworkMotion(stage, selected) {
  const visible = useInView(stage, { amount: 'some' });
  const reduced = useReducedMotion();
  const entered = useInView(stage, { once: true });
  const floats = useRef([]);

  useLayoutEffect(() => {
    if (reduced || !entered) return;
    const root = stage.current;
    const renders = [...root.querySelectorAll('.toolkit-render')];
    if (!renders.length) return;
    const context = gsap.context(() => {
      gsap.from(renders.map(render => render.firstElementChild), {
        opacity: 0, y: 22, duration: 0.75, stagger: 0.12,
        ease: 'power2.out', clearProps: 'opacity,transform',
      });
      floats.current = renders.map((render, index) =>
        gsap.to(render.querySelector('img'), {
          y: -5 - index, duration: 2.7 + index * 0.23, yoyo: true, repeat: -1, ease: 'sine.inOut',
        }),
      );
    }, root);
    // Visibility pauses the existing loops. This setup runs once per motion preference.
    return () => { context.revert(); floats.current = []; };
  }, [reduced, stage, entered]);

  useLayoutEffect(() => {
    floats.current.forEach(animation => animation.paused(!visible));
  }, [visible]);

  useLayoutEffect(() => {
    if (reduced || !visible || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const root = stage.current;
    const movers = [...root.querySelectorAll('.toolkit-render__drift')];
    if (!movers.length) return;
    let shifts;
    const context = gsap.context(() => {
      shifts = movers.map((node, i) => ({
        x: gsap.quickTo(node, 'x', { duration: 0.55 }),
        y: gsap.quickTo(node, 'y', { duration: 0.55 }),
        depth: 0.45 + 0.2 * i,
      }));
    }, root);
    function move(event) {
      if (event.pointerType !== 'mouse') return;
      const { left, top, width, height } = root.getBoundingClientRect();
      for (const shift of shifts) {
        shift.x(((event.clientX - left) / width - 0.5) * shift.depth * 14);
        shift.y(((event.clientY - top) / height - 0.5) * shift.depth * 9);
      }
    }
    function reset() {
      shifts.forEach(shift => { shift.x(0); shift.y(0); });
    }
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', reset);
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', reset);
      context.revert();
    };
  }, [visible, reduced, stage]);

  useLayoutEffect(() => {
    const renders = [...stage.current.querySelectorAll('.toolkit-render')];
    const tweens = renders.map(render => {
      const index = Number(render.closest('[data-station]').dataset.station);
      return gsap.to(render, {
        opacity: selected < 0 || selected === index ? 1 : 0.43,
        scale: selected === index && !reduced ? 1.05 : 1,
        duration: reduced ? 0 : 0.4, ease: 'power2.out', overwrite: 'auto',
      });
    });
    return () => tweens.forEach(tween => tween.kill());
  }, [selected, reduced, stage]);
}
