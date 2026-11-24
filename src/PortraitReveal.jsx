import React, { useEffect, useRef } from 'react';

// Image-space face landmark, projected through the portrait's cover crop.
export function portraitFacePoint(image, width, height) {
  if (!image.naturalWidth || !image.naturalHeight) return null;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  const offsetX = Number.parseFloat(getComputedStyle(image).getPropertyValue('--portrait-offset-x')) || 0;
  return { x: (width - w) * 0.5 + w * 0.515 + offsetX, y: (height - h) * 0.33 + h * 0.35 };
}

export default function PortraitReveal({ children }) {
  const section = useRef(null);
  const timer = useRef();
  const completion = useRef();
  const layer = useRef(null);
  const frame = useRef(null);
  const gesture = useRef(null);
  const pointer = useRef({ clientX: 0, clientY: 0 });
  useEffect(() => () => {
    window.clearTimeout(timer.current);
    window.clearTimeout(completion.current);
    window.cancelAnimationFrame(frame.current);
  }, []);

  function notify(stage) {
    section.current.dispatchEvent(new CustomEvent('portrait-reveal', { bubbles: true, detail: stage }));
  }

  function place(x, y, tracking = false) {
    const element = section.current;
    layer.current.style.setProperty('--portrait-x', x + 'px');
    layer.current.style.setProperty('--portrait-y', y + 'px');
    if (element.dataset.portraitVisible !== 'true') {
      element.dataset.portraitTracking = String(tracking);
      element.dataset.portraitVisible = 'true';
    }
    if (!gesture.current?.started || gesture.current.completed) return;

    const rect = element.getBoundingClientRect();
    const face = portraitFacePoint(layer.current, rect.width, rect.height);
    const radius = Math.max(132, Math.min(window.innerWidth * 0.15, 210));
    // The inner half of the existing feathered mask must cover the face.
    const covered = face && Math.hypot(x - face.x, y - face.y) <= radius * 0.48;
    if (!covered) {
      window.clearTimeout(completion.current);
      completion.current = undefined;
      if (gesture.current.released) endGesture();
    } else if (completion.current === undefined) {
      completion.current = window.setTimeout(() => {
        completion.current = undefined;
        if (!gesture.current?.started || element.dataset.portraitVisible !== 'true') return;
        window.clearTimeout(timer.current);
        gesture.current.completed = true;
        notify('completed');
      }, 220);
    }
  }

  function pointAt(event, tracking = false) {
    const rect = section.current.getBoundingClientRect();
    place(event.clientX - rect.left, event.clientY - rect.top, tracking);
  }

  function track(event) {
    pointer.current.clientX = event.clientX;
    pointer.current.clientY = event.clientY;
    if (frame.current !== null) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      pointAt(pointer.current, true);
    });
  }

  function endGesture() {
    window.clearTimeout(completion.current);
    completion.current = undefined;
    if (gesture.current?.started && !gesture.current.completed) notify('cancelled');
    gesture.current = null;
  }

  function hide() {
    window.cancelAnimationFrame(frame.current);
    frame.current = null;
    endGesture();
    section.current.dataset.portraitVisible = 'false';
  }

  function peek(event) {
    window.clearTimeout(timer.current);
    if (section.current.dataset.portraitVisible === 'true') {
      hide();
      return;
    }
    if (event) pointAt(event);
    else {
      const rect = section.current.getBoundingClientRect();
      const face = portraitFacePoint(layer.current, rect.width, rect.height);
      if (!face) return;
      gesture.current = { started: true };
      notify('started');
      place(face.x, face.y);
    }
    timer.current = window.setTimeout(hide, 2200);
  }

  return (
    <section ref={section} id="about" className="section portrait-section"
      onPointerDown={(event) => {
        if (event.button !== 0 || event.target.closest('button, a')) return;
        endGesture();
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        const active = gesture.current;
        if (active?.id === event.pointerId && !active.started) {
          const dx = Math.abs(event.clientX - active.x);
          const dy = Math.abs(event.clientY - active.y);
          if (event.pointerType === 'touch' ? dx >= 16 && dx > dy * 1.25 : Math.hypot(dx, dy) >= 12) {
            window.clearTimeout(timer.current);
            active.started = true;
            notify('started');
          }
        }
        if (event.pointerType === 'mouse' || active?.started) track(event);
      }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') hide(); }}
      onPointerCancel={hide}
      onPointerUp={(event) => {
        if (event.pointerType === 'touch' && !gesture.current?.started) peek(event);
        
        if (completion.current === undefined && frame.current === null) endGesture();
        else if (gesture.current) gesture.current.released = true;
      }}>
      <img ref={layer} className="portrait-reveal-layer" src="/about-portrait.jpeg" alt="" loading="lazy"
        aria-hidden="true" draggable={false} onError={(event) => { event.currentTarget.hidden = true; }} />
      <span className="portrait-mission-hint" aria-hidden="true">Swipe to reveal</span>
      <button type="button" className="portrait-reveal-key" onClick={() => peek()}>
        Reveal portrait
      </button>
      {children}
    </section>
  );
}
