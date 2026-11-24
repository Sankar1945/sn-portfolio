import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './cinematic-intro.css';

const sessionKey = 'sanku-intro-seen';
const poster = '/intro/sanku_intro_poster.jpg';
const motionQuery = '(prefers-reduced-motion: reduce)';
const exitTime = 550;

export function shouldShowIntro() {
  if (window.matchMedia(motionQuery).matches) return false;
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('intro') === 'replay') return true;
  try {
    return sessionStorage.getItem(sessionKey) !== 'true';
  } catch {
    return false;
  }
}

export default function CinematicIntro({ onExit }) {
  const dialog = useRef(null);
  const video = useRef(null);
  const enter = useRef(null);
  const skip = useRef(null);
  const phase = useRef('welcome');
  const timers = useRef({});
  const [stage, setStage] = useState('welcome');
  const [ending, setEnding] = useState(false);
  const [muted, setMuted] = useState(false);

  const finish = useCallback((reason) => {
    if (phase.current === 'finished') return;
    const wasWelcome = phase.current === 'welcome';
    phase.current = 'finished';
    Object.values(timers.current).forEach(window.clearTimeout);
    try { sessionStorage.setItem(sessionKey, 'true'); } catch { /* The visit can continue. */ }
    video.current.pause();
    setEnding(true);
    timers.current.exit = window.setTimeout(() => onExit(reason),
      wasWelcome || window.matchMedia(motionQuery).matches ? 0 : exitTime);
  }, [onExit]);

  const waitForMedia = useCallback(() => {
    if (phase.current !== 'playback') return;
    window.clearTimeout(timers.current.stall);
    timers.current.stall = window.setTimeout(() => finish('fallback'), 8000);
  }, [finish]);

  function start() {
    if (phase.current !== 'welcome') return;
    phase.current = 'playback';
    setStage('confirming');
    const media = video.current;
    const size = window.matchMedia('(max-width: 767px)').matches ? '720p' : '1080p';
    media.src = '/intro/sanku_intro_web_' + size + '.mp4';
    media.muted = false;
    waitForMedia();
    timers.current.deadline = window.setTimeout(() => finish('fallback'), 42000);
    timers.current.confirm = window.setTimeout(() => setStage('playback'), 320);

    // Call play inside the button activation so the browser can grant audio.
    media.play().catch(() => {
      if (phase.current !== 'playback') return;
      media.muted = true;
      setMuted(true);
      media.play().catch(() => finish('fallback'));
    });
  }

  useLayoutEffect(() => {
    const modal = dialog.current;
    modal.showModal();
    enter.current.focus({ preventScroll: true });
    return () => modal.close();
  }, []);

  useEffect(() => {
    if (stage === 'playback') skip.current?.focus({ preventScroll: true });
  }, [stage]);

  useEffect(() => {
    const media = video.current;
    const preference = window.matchMedia(motionQuery);
    const reduce = () => { if (preference.matches) finish('fallback'); };
    preference.addEventListener('change', reduce);
    return () => {
      Object.values(timers.current).forEach(window.clearTimeout);
      preference.removeEventListener('change', reduce);
      media.pause();
    };
  }, [finish]);

  return (
    <dialog ref={dialog} className="cinematic-intro" data-stage={stage} data-ending={ending}
      aria-label={stage === 'playback' ? 'Sanku cinematic introduction' : 'Portfolio invitation'}
      onCancel={(event) => { event.preventDefault(); finish('skipped'); }}>
      <video ref={video} poster={stage === 'welcome' ? undefined : poster}
        preload="none" playsInline aria-hidden="true" onWaiting={waitForMedia}
        onPlaying={() => window.clearTimeout(timers.current.stall)}
        onEnded={() => finish('completed')} onError={() => { if (phase.current === 'playback') finish('fallback'); }} />
      {stage !== 'playback' && (
        <div className="cinematic-welcome">
          <div className="cinematic-welcome__content">
            <div className="cinematic-welcome__laptop" aria-hidden="true">
              <div className="cinematic-welcome__display">
                <span className="cinematic-welcome__notification">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
            <p className="cinematic-welcome__eyebrow">SYSTEM NOTIFICATION</p>
            <h1>A new connection detected.</h1>
            <p className="cinematic-welcome__copy">Someone on the other side has a story to show you.</p>
            <p className="cinematic-welcome__status">One unopened invitation</p>
            <div className="cinematic-welcome__actions">
              <button ref={enter} type="button" aria-disabled={stage === 'confirming'} onClick={start}>Enter the Digital World</button>
              <button type="button" onClick={() => finish('skipped')}>Explore Portfolio without intro</button>
            </div>
          </div>
        </div>
      )}
      {stage === 'playback' && (
        <div className="cinematic-intro__controls">
          <button type="button" aria-pressed={!muted} aria-label="Intro sound" onClick={() => {
            video.current.muted = !muted;
            setMuted(!muted);
          }}>{muted ? 'Sound off' : 'Sound on'}</button>
          <button type="button" ref={skip} onClick={() => finish('skipped')}>Skip Intro</button>
        </div>
      )}
    </dialog>
  );
}