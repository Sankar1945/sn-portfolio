import React, { useRef } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Check } from 'lucide-react';

export default function SectionConnector() {
  const connector = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: connector, offset: ['start 90%', 'start 60%'] });
  const endpoint = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const spark = useTransform(scrollYProgress, (progress) => Number(progress < 1));
  const check = useTransform(scrollYProgress, (progress) => Number(progress === 1));

  return (
    <div ref={connector} className="section-circuit" aria-hidden="true">
      <m.i className="section-circuit__trace" style={{ scaleX: reduced ? 1 : scrollYProgress }} />
      {!reduced && <m.i className="section-circuit__spark" style={{ left: endpoint, opacity: spark }} />}
      <m.span className="section-circuit__check" style={{ opacity: reduced ? 1 : check }}><Check size={12} /></m.span>
    </div>
  );
}
