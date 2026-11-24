import React from 'react';

const arcs = [
  [295, 108], [342, 131], [380, 154], [418, 174], [530, 193],
];
const traces = [
  'M182 565l99-57h86l79-40h63', 'M301 624l118-55h59l61-42h58',
  'M437 582l44-35 58-7 43-37', 'M662 603l52-37 41-47',
  'M786 605l53-28 77 2 68-41h45', 'M976 607l-40-19h-60l-38-25',
  'M965 479h61l61-35h45', 'M855 329h72l33 20h57',
  'M470 379h86l38-26h45', 'M132 480l72-42h88l34-22h48',
];
const points = [[281,508],[446,468],[419,569],[539,527],[714,566],[755,519],
  [839,577],[984,538],[1026,479],[1087,444],[960,349],[594,353],[204,438],[374,416]];

export default function WorkflowAtmosphere({ step, shared = false }) {
  if (!shared) return <div className="workflow-atmosphere" data-active-step={step} aria-hidden="true" />;

  return (
    <svg className="hero-hologram" viewBox="0 0 1250 720" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="orbital-light" x1="0" y1=".3" x2="1" y2=".7" gradientUnits="objectBoundingBox">
          <stop stopColor="#268eff" stopOpacity=".02"/><stop offset=".24" stopColor="#287cd1" stopOpacity=".24"/>
          <stop offset=".52" stopColor="#12c6ff" stopOpacity=".53"/><stop offset=".78" stopColor="#2856b4" stopOpacity=".23"/>
          <stop offset="1" stopColor="#4d74d7" stopOpacity=".45"/>
        </linearGradient>
        <linearGradient id="hero-glint"><stop stopColor="#348fff" stopOpacity="0"/>
          <stop offset=".52" stopColor="#58dbff"/><stop offset="1" stopColor="#536aff" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="orbit-cyan" gradientUnits="userSpaceOnUse" cx="672" cy="489" r="88">
          <stop stopColor="#95f7ff"/><stop offset=".3" stopColor="#14baff" stopOpacity=".85"/>
          <stop offset="1" stopColor="#166ae8" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orbit-blue" gradientUnits="userSpaceOnUse" cx="1172" cy="489" r="66">
          <stop stopColor="#87a6ff"/><stop offset="1" stopColor="#4576f5" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="orbit-signature">
          <stop style={{ stopColor: "var(--signature)" }} stopOpacity="0"/>
          <stop offset=".54" style={{ stopColor: "var(--signature-light)" }} stopOpacity=".65"/>
          <stop offset="1" style={{ stopColor: "var(--signature)" }} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <g className="hero-hologram__field">
        <g className="hero-hologram__arcs" transform="rotate(-4 886 387)">
          {arcs.map(([rx, ry]) => <ellipse key={rx} cx="886" cy="387" rx={rx} ry={ry}/>)}
          <ellipse cx="886" cy="387" rx="342" ry="131" stroke="url(#orbit-cyan)" strokeWidth="7" opacity=".11"/>
          <ellipse cx="886" cy="387" rx="342" ry="131" stroke="url(#orbit-cyan)" strokeWidth="1.6"/>
          <ellipse cx="886" cy="387" rx="380" ry="154" stroke="url(#orbit-blue)" strokeWidth="1.5"/>
          <path d="M447 478q106 54 238 70" stroke="url(#orbit-signature)" strokeWidth="1.4"/>
          <path d="M538 475q51 50 147 64M950 536q133-20 196-70" stroke="url(#hero-glint)" strokeWidth="2"/>
        </g>
        <g className="hero-hologram__traces">
          {traces.map((d) => <path key={d} d={d} />)}
          {points.map(([x, y]) => <circle key={x + ':' + y} cx={x} cy={y} r="2" />)}
        </g>
      </g>
    </svg>
  );
}
