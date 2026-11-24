import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import ProjectConversation from './ProjectConversation';
import { prepare, useSankuAnimation } from './useSankuAnimation';
import { useSankuSection } from './useSankuSection';
import './sanku.css';

import { sankuDialogue, sankuProjectReactions, sankuReadingTime } from './sankuDialogue';
import { portraitFacePoint } from './PortraitReveal';

function useCompanionPlacement(dockRef, open, explanation, portrait, portraitDialogue, certification, inProjects) {


  useLayoutEffect(() => {
    const dock = dockRef.current;

    function resetOffsets() {
      for (const property of ['--mini-lift', '--mini-shift', '--sanku-portrait-x', '--sanku-portrait-y']) {
        dock.style.removeProperty(property);
      }
    }
    if (inProjects) {
      resetOffsets();
      return;
    }
    let frame = 0;

    function update() {
      frame = 0;
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      // Keep the dock stable while the section observer is settling on a scroll jump.
      const projectStage = document.querySelector(".project-showcase[data-pinned='true']")?.getBoundingClientRect();
      if (!portrait && projectStage && projectStage.top <= 83 && projectStage.bottom >= height - 1) {
        resetOffsets();
        return;
      }
      const face = dock.querySelector('.sanku__trigger');
      const bubble = open ? dock.querySelector('.sanku__bubble') : null;
      const right = width - 12;
      const bottom = height - 12;
      const header = document.querySelector('header.nav');
      const minTop = (header?.getBoundingClientRect().bottom ?? 0) + 8;
      const extent = face.offsetHeight + (bubble ? bubble.offsetHeight + 8 : 0);
      const controls = Array.from(document.querySelectorAll('main a[href], main button'))
        .filter((item) => !item.closest('[inert]'))
        .flatMap((item) => Array.from(item.getClientRects()))
        .filter((rect) => rect.bottom > minTop && rect.top < height);

      function findOffset(bubbleWidth, stackHeight, edgeRight, avoid = controls) {
        const left = edgeRight - bubbleWidth - 5;
        const rightControls = avoid.filter((rect) => rect.right > left && rect.left < edgeRight + 5);
        let edge = bottom;
        for (const rect of rightControls.sort((a, b) => b.bottom - a.bottom)) {
          if (rect.top < edge + 5 && rect.bottom > edge - stackHeight - 5) edge = rect.top - 6;
        }
        return edge - stackHeight >= minTop ? bottom - edge : null;
      }

      const cards = certification ? document.querySelector('.credential-stack')?.getBoundingClientRect() : null;
      const protectedRects = [...controls, ...[cards].filter(Boolean)];
      let shift = 0;
      let offset = bubble ? findOffset(bubble.offsetWidth, extent, right, protectedRects) : null;
      if (offset === null && bubble && (explanation || certification)) {
        const leftDockRight = 12 + bubble.offsetWidth;
        offset = findOffset(bubble.offsetWidth, extent, leftDockRight, protectedRects);
        if (offset !== null) shift = right - leftDockRight;

        if (offset === null && explanation) {
          // On narrow screens the full set of cards can fill every vertical slot.
          // Keep the current group's actions reachable so the visitor can switch topics.
          const source = explanation.source;
          const group = source.closest('.skill-explanations, .toolkit-actions');
          const priorities = Array.from(group?.querySelectorAll('button') ?? [])
            .flatMap((button) => Array.from(button.getClientRects()));
          offset = findOffset(bubble.offsetWidth, extent, right, priorities);
          offset ??= findOffset(bubble.offsetWidth, extent, right, Array.from(source.getClientRects()));
        }
      }
      if (portraitDialogue && bubble && width < 900) {
        const image = document.querySelector('#about .portrait-reveal-layer');
        const rect = image?.getBoundingClientRect();
        const point = rect && portraitFacePoint(image, rect.width, rect.height);
        if (point) {
          const x = rect.left + point.x;
          const y = rect.top + point.y;
          const faceArea = { left: x - 65, right: x + 65, top: y - 76, bottom: y + 76 };
          const safeOffset = findOffset(bubble.offsetWidth, extent, right, [...controls, faceArea]);
          if (safeOffset !== null) {
            offset = safeOffset;
            shift = 0;
          }
        }
      }
      if (certification && bubble && offset === null) {
        offset = findOffset(bubble.offsetWidth, extent, right) ?? 0;
      }
      offset ??= findOffset(face.offsetWidth, certification ? face.offsetHeight : extent, right) ?? 0;
      dock.style.setProperty('--mini-lift', offset + 'px');
      dock.style.setProperty('--mini-shift', shift + 'px');

      let dx = 0;
      let dy = 0;
      if (portrait && width >= 900) {
        const image = portrait.querySelector('.portrait-reveal-layer');
        const rect = image.getBoundingClientRect();
        const point = portraitFacePoint(image, rect.width, rect.height);
        if (point && rect.bottom > minTop && rect.top < bottom) {
          const faceX = rect.left + point.x;
          const faceY = rect.top + point.y;
          const span = Math.max(face.offsetWidth, bubble?.offsetWidth ?? 0);
          const margin = 118;
          const candidateRight = [faceX + margin + span, faceX - margin]
            .find((edge) => edge <= right && edge - span >= 12);
          if (candidateRight !== undefined) {
            const text = [...portrait.querySelectorAll('.sectionTitle, .intro')].map((item) => item.getBoundingClientRect());
            const preferredBottom = Math.min(bottom, rect.bottom - 12, faceY + extent * 0.64);
            const safeBottom = [preferredBottom, bottom].find((edge) =>
              edge - extent >= minTop && ![...text, ...controls].some((item) =>
                item.right > candidateRight - span && item.left < candidateRight &&
                item.bottom > edge - extent && item.top < edge));
            if (safeBottom !== undefined) {
              dx = candidateRight - (right - shift);
              dy = safeBottom - (bottom - offset);
            }
          }
        }
      }
      dock.style.setProperty('--sanku-portrait-x', dx + 'px');
      dock.style.setProperty('--sanku-portrait-y', dy + 'px');
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    const observer = new ResizeObserver(schedule);
    observer.observe(dock);
    const main = document.querySelector('main');
    if (main) observer.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [dockRef, open, explanation, portrait, portraitDialogue, certification, inProjects]);
}

export default function Sanku({ explanation: incomingExplanation, clearExplanation, cinematicArrival, activeProject }) {
  const [message, setMessage] = useState(() => ({ key: cinematicArrival ? 'arrival' : 'home' }));
  const [secret, setSecret] = useState(null);
  const secretRef = useRef(null);
  const explanation = secret ? null : incomingExplanation;
  const [attentive, setAttentive] = useState(false);
  const [focused, setFocused] = useState(false);
  const dock = useRef(null);
  const trigger = useRef(null);
  const close = useRef(null);
  const section = useSankuSection();
  const reduceMotion = useReducedMotion();
  const { pose, src, play, loaded, busy, cancelPending } = useSankuAnimation(reduceMotion, cinematicArrival ? sankuDialogue.arrival[0] : sankuDialogue.home[0]);
  const reactionContext = useRef(null);
  const pendingCelebration = useRef(null);
  const [dwelledCard, setDwelledCard] = useState(null);
  const lastCard = useRef(null);
  const cardCooldowns = useRef(new Map());
  useLayoutEffect(() => {
    const pending = pendingCelebration.current;
    if (pending && section?.id === 'certifications') pending.visit ??= section;
    else if (pending?.visit) pendingCelebration.current = null;
    reactionContext.current = { section, blocked: Boolean(incomingExplanation || secret || message?.focus), messageKey: message?.key, cancelPending, reduced: reduceMotion };
  }, [section, incomingExplanation, secret, message, cancelPending, reduceMotion]);
  const projectConversation = Boolean(explanation?.project);
  const open = Boolean(message || explanation);
  const inProjects = section?.id === 'projects' || projectConversation;
  const portraitDialogue = Boolean(secret || explanation?.about || message?.key === 'about' || message?.key === 'hint');
  useCompanionPlacement(dock, open, explanation, secret?.portrait, portraitDialogue, message?.key === 'certifications', inProjects && !secret);

  useEffect(() => {
    if (!explanation || secret) return;
    setMessage(null);
    play(explanation.project === 'mascot' ? sankuDialogue.classified[0] : 'explaining');
  }, [explanation, secret, play]);

  function startSecretMission() {
    const portrait = document.getElementById('about');
    if (!portrait) return;
    clearExplanation();
    setSecret({ portrait, key: 'secretMission', mission: true });
    setMessage({ key: 'secretMission', focus: true });
    play(sankuDialogue.secretMission[0]);
    const rect = portrait.getBoundingClientRect();
    const image = portrait.querySelector('.portrait-reveal-layer');
    const point = portraitFacePoint(image, rect.width, rect.height);
    if (!point || rect.top + point.y < 105 || rect.top + point.y > window.innerHeight - 90) {
      portrait.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    }
  }

  useEffect(() => {
    secretRef.current = secret;
    if (!secret || secret.key === 'completed') return;
    secret.portrait.dataset.secretMission = 'true';
    return () => { delete secret.portrait.dataset.secretMission; };
  }, [secret]);

  useEffect(() => {
    function onPortrait(event) {
      const previous = secretRef.current;
      if (event.detail === 'cancelled') {
        setSecret(previous?.mission ? { ...previous, key: 'secretMission' } : null);
        setMessage({ key: previous?.mission ? 'secretMission' : 'hint' });
        return;
      }
      const key = event.detail;
      clearExplanation();
      setSecret({ portrait: event.target, key, mission: previous?.mission });
      setMessage({ key });
      if (!(key === 'started' && previous?.mission)) play(sankuDialogue[key][0]);
    }
    document.addEventListener('portrait-reveal', onPortrait);
    return () => {
      document.removeEventListener('portrait-reveal', onPortrait);
    };
  }, [clearExplanation, play]);

  useEffect(() => {
    function certificationOnScreen(section) {
      const bounds = section?.getBoundingClientRect();
      const line = window.innerHeight * .55;
      return bounds && bounds.top <= line && bounds.bottom > line;
    }
    function onRise(event) {
      const { section, blocked, reduced } = reactionContext.current;
      pendingCelebration.current = { visit: section?.id === 'certifications' ? section : null, token: event.detail };
      if (pendingCelebration.current && !blocked && !reduced) prepare('celebration').catch(() => {});
    }
    function onSplit(event) {
      const { section, blocked } = reactionContext.current;
      const pending = pendingCelebration.current;
      pendingCelebration.current = null;
      if (blocked || pending?.token !== event.detail || pending.visit !== section ||
          !certificationOnScreen(event.target.closest('#certifications'))) return;
      setMessage({ key: 'certifications', visit: pending.visit });
      play(sankuDialogue.certifications[0]);
    }
    function clearOnExit() {
      const { messageKey, blocked, cancelPending: cancel } = reactionContext.current;
      if (pendingCelebration.current?.visit && !certificationOnScreen(document.getElementById('certifications'))) {
        pendingCelebration.current = null;
      }
      if (blocked || !messageKey) return;
      const owner = document.getElementById(messageKey === 'hint' ? 'about' : messageKey);
      if (!owner || certificationOnScreen(owner)) return;
      if (messageKey === 'certifications') cancel('celebration');
      setMessage((previous) => previous?.key === messageKey ? null : previous);
    }
    document.addEventListener('certifications-rise', onRise);
    document.addEventListener('certifications-split', onSplit);
    window.addEventListener('scroll', clearOnExit, { passive: true });
    return () => {
      document.removeEventListener('certifications-rise', onRise);
      document.removeEventListener('certifications-split', onSplit);
      window.removeEventListener('scroll', clearOnExit);
      pendingCelebration.current = null;
    };
  }, [play]);

  useEffect(() => {
    if (!section || secret) return;
    setMessage((previous) => {
      if (!previous) return null;
      if ((previous.key === 'certifications' && !previous.visit) || previous.key === section.id || (section.id === 'about' && previous.key === 'hint') ||
          (section.id === 'home' && ['arrival', 'home', 'again'].includes(previous.key))) return previous;
      return null;
    });
  }, [section, secret]);

  useEffect(() => {
    if (!explanation?.project) return;
    const source = explanation.source;
    const card = source.closest('.showcase-panel');
    const stack = source.closest('.project-showcase');
    const closeInactive = () => {
      const activeProject = stack?.dataset.activeProject;
      if (!source.isConnected || (activeProject && activeProject !== explanation.project) || card?.inert) clearExplanation();
    };
    const observer = new MutationObserver(closeInactive);
    if (stack) observer.observe(stack, { attributes: true, subtree: true, attributeFilter: ['data-active-project', 'inert'] });
    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) clearExplanation();
    });
    if (card) visibility.observe(card);
    return () => {
      observer.disconnect();
      visibility.disconnect();
    };
  }, [explanation, clearExplanation]);

  const lastReaction = useRef(null);
  useEffect(() => {
    if (!section) return;
    if (explanation?.project && section.id !== 'projects') {
      const source = explanation.source.getBoundingClientRect();
      if (source.bottom < 75 || source.top >= window.innerHeight) clearExplanation();
    }
    if (secret && section.id === 'about') {
      lastReaction.current = section;
      return;
    }
    if (secret && section.id !== 'about' && lastReaction.current?.id === 'about') {
      setSecret(null);
      setMessage(null);
      return;
    }
    const activeCard = section.id === 'projects' && dwelledCard?.visit === section &&
      dwelledCard.id === activeProject && dwelledCard !== lastCard.current ? dwelledCard : null;

    if (section.id === 'projects' && explanation?.project) {
      lastReaction.current = section;
      if (activeCard?.id === explanation.project) lastCard.current = activeCard;
    }
    if (busy || explanation || secret || message?.focus) return;
    if (section === lastReaction.current) {
      if (!activeCard) return;
      const [gesture] = sankuProjectReactions[activeCard.id];
      lastCard.current = activeCard;
      cardCooldowns.current.set(activeCard.id, performance.now());
      setMessage({ key: 'projects', projectId: activeCard.id });
      play(gesture);
      return;
    }
    const previous = lastReaction.current;
    lastReaction.current = section;
    if (section.id === 'certifications') return;
    if (section.id === 'home') {
      if (previous) setMessage(null);
      return;
    }
    const reaction = Object.hasOwn(sankuDialogue, section.id) && sankuDialogue[section.id];
    if (!reaction) return;
    setMessage({ key: section.id });
    play(reaction[0]);
  }, [section, busy, explanation, secret, clearExplanation, play, activeProject, dwelledCard, message]);

  useEffect(() => {
    setDwelledCard(null);
    if (section?.id !== 'projects' || !activeProject) return;
    const elapsed = performance.now() - (cardCooldowns.current.get(activeProject) ?? -Infinity);
    const timer = window.setTimeout(() => {
      setDwelledCard({ visit: section, id: activeProject });
    }, Math.max(380, 2000 - elapsed));
    return () => window.clearTimeout(timer);
  }, [section, activeProject]);

  useEffect(() => {
    setMessage((previous) => previous?.projectId && previous.projectId !== activeProject ? null : previous);
  }, [activeProject]);

  useEffect(() => {
    if (!message || ['started', 'secretMission'].includes(message.key) || explanation) return;
    const timer = window.setTimeout(() => {
      if (message.key === 'about') setMessage({ key: 'hint' });
      else setMessage(null);
      if (message.key === 'completed') setSecret(null);
    }, sankuReadingTime((message.projectId ? sankuProjectReactions[message.projectId] : sankuDialogue[message.key])[1]));
    return () => window.clearTimeout(timer);
  }, [message, explanation, open]);

  useEffect(() => {
    if (!open || (!message?.focus && !explanation)) return;
    close.current?.focus({ preventScroll: true });
  }, [message, explanation, open]);

  const dismiss = useCallback(() => {
    setMessage(null);
    if (!projectConversation) play('idle');
    setSecret(null);
    clearExplanation();
    const source = explanation?.source;
    const reachable = source?.isConnected && source.getClientRects().length && !source.closest('[inert]');
    (reachable ? source : trigger.current)?.focus({ preventScroll: true });
  }, [clearExplanation, explanation, play, projectConversation]);

  useEffect(() => {
    if (!open && !projectConversation) return;
    function handleEscape(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      dismiss();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, projectConversation, dismiss]);

  return createPortal(
    <aside ref={dock} className="sanku" aria-label="Sanku companion"
      data-pose={pose} data-explaining={Boolean(explanation)} data-portrait-gesture={Boolean(secret && secret.key !== 'completed')}
      data-portrait-dialogue={portraitDialogue} data-projects={inProjects && !secret}
      data-attentive={attentive || focused}
      onPointerEnter={(event) => { if (event.pointerType !== 'touch') setAttentive(true); }}
      onPointerLeave={() => setAttentive(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <button ref={trigger} className="sanku__trigger" type="button" aria-label="Talk to Sanku"
        aria-disabled={section?.id === 'projects' && !projectConversation || undefined}
        aria-expanded={open} aria-controls={open ? (projectConversation ? 'sanku-project-message' : 'sanku-message') : undefined}
        onClick={() => {
          if (projectConversation) {
            dismiss();
            return;
          }
          if (secret || section?.id === 'projects') return;
          clearExplanation();
          const key = section?.id === 'home' || !section ? 'again' :
            Object.hasOwn(sankuDialogue, section.id) ? section.id : 'idle';
          setMessage({ key, focus: true });
          play(sankuDialogue[key][0]);
        }}>
        <img key={src} src={src} onLoad={loaded} onError={() => { if (pose !== 'idle') play('idle'); }}
          alt="" draggable={false} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div id={projectConversation ? 'sanku-project-message' : 'sanku-message'}
            className={projectConversation ? 'sanku__bubble sanku__bubble--project' : 'sanku__bubble'} data-auto-project={message?.key === 'projects' && !explanation} role="group"
            aria-label="Message from Sanku"
            initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}>
            <div className="sanku__heading">
              <strong>Sanku</strong>
              <button ref={close} type="button" onClick={dismiss} aria-label={projectConversation ? 'Close project explanation' : 'Close Sanku message'}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {explanation && <strong className="sanku__topic">{explanation.name}</strong>}
            {projectConversation ? <ProjectConversation key={explanation.project} project={explanation.project} /> :
              <p aria-live="polite">{explanation?.about ? sankuDialogue.about[1] : explanation?.text ?? (message?.projectId ? sankuProjectReactions[message.projectId] : sankuDialogue[message?.key ?? 'idle'])[1]}</p>}
            {(message?.key === 'about' || message?.key === 'hint' || explanation?.about) && (
              <button className="sanku__back" type="button" onClick={startSecretMission}>Tell me the secret</button>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </aside>, document.body
  );
}
