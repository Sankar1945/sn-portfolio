import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Image, Layers3, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { SectionIntro } from './PortfolioMotion';
import SectionConnector from './SectionConnector';
import { useCredentialEntrance } from './useCredentialEntrance';
import './certifications.css';

const credentials = [
  {
    id: 'microsoft',
    issuer: 'Microsoft',
    type: 'Microsoft Applied Skills',
    title: 'Create and manage automated processes by using Power Automate',
    date: '2026-10-20',
    dateLabel: 'October 20, 2026',
    datePrefix: 'Earned',
    image: '/certifications/microsoft-applied-skills.png',
    dimensions: [800, 663],
    verificationUrl: 'https://learn.microsoft.com/en-us/users/sankaranarayanant-0584/credentials/9d52a49bce7d0c3f?ref=https%3A%2F%2Fwww.linkedin.com%2F',
    shortLabel: 'Power Automate',
    Icon: BadgeCheck,
  },
  {
    id: 'databricks',
    issuer: 'Databricks Academy',
    title: 'Databricks Accredited Generative AI Fundamentals',
    date: '2026-10-21',
    dateLabel: 'October 21, 2026',
    datePrefix: 'Issued',
    image: '/certifications/databricks-generative-ai.png',
    dimensions: [1280, 963],
    verificationUrl: 'https://credentials.databricks.com/cfe416ee-b6e0-4d9d-b7b6-ba63d4aa3a3a#acc.jUDuTkoO',
    shortLabel: 'Generative AI Fundamentals',
    Icon: Layers3,
  },
];

function CertificatePreview({ credential, onDismiss }) {
  const dialog = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  useLayoutEffect(() => {
    const modal = dialog.current;
    modal.showModal();
    return () => modal.close();
  }, []);

  return (
    <dialog ref={dialog} id="certificate-preview" className="credential-preview" aria-labelledby="certificate-preview-title"
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onDismiss(); }}>
      <div className="credential-preview__content">
        <header className="credential-preview__bar">
          <h3 id="certificate-preview-title">{credential.shortLabel}</h3>
          <div>
            <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? 'Fit image' : 'Zoom image'}</button>
            <button type="button" autoFocus aria-label="Close certificate preview" onClick={onDismiss}><X size={19} aria-hidden="true" /></button>
          </div>
        </header>
        <div className="credential-preview__image" data-zoomed={zoomed} tabIndex={zoomed ? 0 : undefined}
          role="group" aria-label="Certificate image">
          <img src={credential.image} alt={credential.title + ' certificate from ' + credential.issuer} />
        </div>
      </div>
    </dialog>
  );
}

export default function Certifications({ enabled }) {
  const cards = useRef(null);
  const trigger = useRef(null);
  const reduced = useReducedMotion();
  const canObserve = typeof IntersectionObserver !== 'undefined';
  const { playing, settled, startTimeline, finish } = useCredentialEntrance(cards, reduced, enabled);
  const [preview, setPreview] = useState(null);
  const interactive = settled || reduced || !canObserve;

  function dismissPreview() {
    setPreview(null);
    window.requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  }

  return (
    <section id="certifications" className="section">
      <SectionConnector />
      <SectionIntro><div className="eyebrow">CERTIFICATIONS</div><h2 className="sectionTitle">Always <span>Learning.</span></h2></SectionIntro>
      <div className="credential-stack" ref={cards} data-revealed={playing} data-settled={settled} data-can-observe={canObserve}>
        {credentials.map((credential, index) => {
          const { id, issuer, type, title, date, dateLabel, datePrefix, image, dimensions, verificationUrl, Icon } = credential;
          return (
            <article key={id} className="credential-card"
              onAnimationStart={index === 1 ? (event) => {
                if (event.target === event.currentTarget && event.animationName === 'credential-entry') startTimeline(event);
              } : undefined}
              onAnimationEnd={index === 1 ? (event) => {
                if (event.target === event.currentTarget && event.animationName === 'credential-entry') finish();
              } : undefined}>
              <div className="credential-card__identity">
                <Icon size={24} aria-hidden="true" />
                <div>
                  <p className="credential-card__issuer">{issuer}</p>
                  {type && <p className="credential-card__type">{type}</p>}
                </div>
              </div>
              <h3>{title}</h3>
              <p className="credential-card__date">{datePrefix} <time dateTime={date}>{dateLabel}</time></p>
              <div className="credential-card__image">
                <img src={image} alt={title + ' certificate from ' + issuer} width={dimensions[0]} height={dimensions[1]} loading="lazy" decoding="async" />
              </div>
              <div className="credential-card__actions" inert={interactive ? undefined : ''}>
                <button type="button" aria-haspopup="dialog" onClick={(event) => {
                  trigger.current = event.currentTarget;
                  setPreview(credential);
                }}><Image size={16} aria-hidden="true" /> View Certificate</button>
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                  Verify Credential <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
      {preview && <CertificatePreview credential={preview} onDismiss={dismissPreview} />}
    </section>
  );
}
