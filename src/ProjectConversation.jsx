import React, { useLayoutEffect, useRef, useState } from 'react';
import { projectDialogues } from './projectDialogues';

export default function ProjectConversation({ project }) {
  const { greeting, topics } = projectDialogues[project];
  const [current, setCurrent] = useState(null);
  const back = useRef(null);
  const topicButtons = useRef([]);
  const focusTarget = useRef(null);
  const selected = current === null ? null : topics[current];

  function openTopic(index) {
    focusTarget.current = 'back';
    setCurrent(index);
  }

  function returnToTopics() {
    focusTarget.current = current;
    setCurrent(null);
  }

  useLayoutEffect(() => {
    if (focusTarget.current === null) return;
    if (focusTarget.current === 'back') {
      back.current.closest('.sanku__bubble')?.scrollTo({ top: 0 });
      back.current.focus({ preventScroll: true });
    } else {
      const button = topicButtons.current[focusTarget.current];
      button?.focus({ preventScroll: true });
      const bubble = button?.closest('.sanku__bubble');
      if (bubble) {
        const overflow = button.getBoundingClientRect().bottom - bubble.getBoundingClientRect().bottom + 10;
        if (overflow > 0) bubble.scrollBy({ top: overflow });
      }
    }
    focusTarget.current = null;
  }, [current]);

  return (
    <div className="sanku__conversation">
      <div aria-live="polite" aria-atomic="true">
        {selected && <strong className="sanku__question">{selected[0]}</strong>}
        <p>{selected?.[1] ?? greeting}</p>
      </div>
      <div className="sanku__choices" role="group" aria-label="Project questions" hidden={selected !== null}>
        {topics.map(([question], index) => (
          <button key={question} ref={(button) => { topicButtons.current[index] = button; }}
            type="button" onClick={() => openTopic(index)}>{question}</button>
        ))}
      </div>
      <button ref={back} type="button" className="sanku__back"
        hidden={selected === null} onClick={returnToTopics}>Back to questions</button>
    </div>
  );
}
