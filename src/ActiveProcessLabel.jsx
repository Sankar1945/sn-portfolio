import React from 'react';

export default function ActiveProcessLabel({ name, description, playing }) {
  return (
    <div id="workflow-description" className="workflow-sr-only" aria-live={playing ? 'off' : 'polite'}>
      {name}. {description}
    </div>
  );
}
