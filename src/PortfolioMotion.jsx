import React from 'react';
import { domAnimation, LazyMotion, m, MotionConfig } from 'motion/react';
import './portfolio-reveals.css';

const transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };
const entrance = {
  waiting: { opacity: 0.65, y: 14 },
  shown: { opacity: 1, y: 0, transition },
};
const sequence = {
  shown: { transition: { staggerChildren: 0.08 } },
};

const motionQuery = '(prefers-reduced-motion: reduce)';

function subscribe(listener) {
  const preference = window.matchMedia(motionQuery);
  preference.addEventListener('change', listener);
  return () => preference.removeEventListener('change', listener);
}

function allowsMotion() {
  return !window.matchMedia(motionQuery).matches;
}

function usePageMotion() {
  return React.useSyncExternalStore(subscribe, allowsMotion);
}

export function PortfolioMotion({ children }) {
  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>{children}</LazyMotion></MotionConfig>;
}

export function HeroCopy({ children }) {
  const animate = usePageMotion();
  return (
    <m.div className="heroText" variants={sequence}
      initial={animate ? 'waiting' : false} animate="shown">
      {React.Children.map(children, (child) => (
        <m.div variants={animate ? entrance : undefined}>{child}</m.div>
      ))}
    </m.div>
  );
}

export function SectionIntro({ children }) {
  return (
    <Reveal effect="group" stagger={0.15}>
      {React.Children.map(children, (child, index) => <RevealPart effect={index === 0 ? 'fade' : 'rise'}>{child}</RevealPart>)}
    </Reveal>
  );
}

const poses = {
  rise: { opacity: 0.54, y: 'var(--reveal-rise)' },
  fade: { opacity: 0.62 },
  float: { opacity: 0.58, y: 'var(--reveal-rise)', scale: 0.96 },
  slide: { opacity: 0.56, x: 'var(--reveal-slide)' },
  image: { opacity: 0.58, scale: 0.96 },
  icon: { opacity: 0.6, y: 8, scale: 0.92 },
  draw: { scaleX: 0, opacity: 0 },
  trace: { scaleY: 0, opacity: 0 },
  glow: { scale: 0.8, opacity: 0 },
  edge: { x: '-120%', opacity: 0 },
  orbit: { rotate: -90, opacity: 0 },
  halo: { opacity: 0, scale: 0.94 },
  convergeLeft: { x: 'var(--toolkit-left)', y: 24, scale: 0.96, rotateY: 5, opacity: 0.64 },
  convergeRight: { x: 'var(--toolkit-right)', y: 34, scale: 0.94, rotateY: -5, opacity: 0.64 },
  group: {},
};

const endPoses = {
  rise: { opacity: 1, y: 0 },
  fade: { opacity: 1 },
  float: { opacity: 1, y: 0, scale: 1 },
  slide: { opacity: 1, x: 0 },
  image: { opacity: 1, scale: 1 },
  icon: { opacity: 1, y: 0, scale: 1 },
  draw: { scaleX: 1, opacity: 1 },
  trace: { scaleY: 1, opacity: 1 },
  glow: { scale: 1, opacity: 0.8 },
  edge: { x: '360%', opacity: [0, 0.82, 0] },
  orbit: { rotate: 270, opacity: [0, 0.8, 0] },
  halo: { opacity: [0, 0.8, 0], scale: 1 },
  convergeLeft: { x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1 },
  convergeRight: { x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1 },
  group: {},
};

function scrollVariants(effect, delay, stagger, lead) {
  return {
    waiting: poses[effect],
    shown: {
      ...endPoses[effect],
      transition: {
        duration: 0.8, ease: [0.24, 0.74, 0.32, 1],
        // A child delay would replace Motion's inherited stagger, even at zero.
        ...(delay === undefined ? {} : { delay }),
        delayChildren: (delay ?? 0) + lead, staggerChildren: stagger,
      },
    },
  };
}

export function Reveal({ as = 'div', effect = 'rise', delay = 0, stagger = 0, lead = 0, viewport, children, ...props }) {
  const animate = usePageMotion() && typeof IntersectionObserver !== 'undefined';
  const Element = m[as];
  return (
    <Element {...props} data-scroll-reveal="" inherit={false}
      variants={scrollVariants(effect, delay, stagger, lead)}
      initial={animate ? 'waiting' : false}
      whileInView={animate ? 'shown' : undefined}
      viewport={{ once: true, amount: 0.34, margin: '-75px 0px -64px 0px', ...viewport }}>
      {children}
    </Element>
  );
}

export function RevealPart({ as = 'div', effect = 'rise', stagger = 0, lead = 0, children, ...props }) {
  const Element = m[as];
  return (
    <Element {...props} data-scroll-reveal="" variants={scrollVariants(effect, undefined, stagger, lead)}>
      {children}
    </Element>
  );
}
