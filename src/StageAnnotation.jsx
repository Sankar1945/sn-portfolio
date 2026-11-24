import React from 'react';
import { Vector3 } from 'three';

const point = new Vector3();
const labelWidth = 178;
const labelHeight = 44;
const gap = 8;

export function placeStageAnnotation(element, camera, size, positions, animations, active) {
  if (!element) return;
  const pixels = size.width * camera.zoom / (camera.right - camera.left);
  const boxes = positions.map(([x, , z], index) => {
    const sprite = animations?.[index];
    point.set(x, index === active ? 0.35 : 0.14, z).project(camera);
    const center = (point.x * 0.5 + 0.5) * size.width;
    const anchor = (0.5 - point.y * 0.5) * size.height;
    const width = (sprite?.width ?? 1.92) * pixels;
    return {
      center, anchor,
      left: center - Math.max(0.92 * pixels, width * (sprite?.center ?? 0.5)),
      right: center + Math.max(0.92 * pixels, width * (1 - (sprite?.center ?? 0.5))),
      top: anchor - width * (sprite?.bottom ?? 0.9),
      bottom: anchor + 1.16 * pixels,
    };
  });
  const target = boxes[active];
  const host = element.parentElement;
  host.parentElement.style.setProperty('--annotation-anchor', (target.center / size.width * 100).toFixed(1) + '%');

  const clamp = (value, limit) => Math.max(gap, Math.min(value, limit - gap));
  const xs = [target.center - labelWidth / 2, ...boxes.flatMap(box => [box.left - labelWidth - gap, box.right + gap])];
  const ys = [target.anchor - labelHeight / 2, ...boxes.flatMap(box => [box.top - labelHeight - gap, box.bottom + gap])];
  let best = null;
  let bestDistance = Infinity;
  for (const x of xs) {
    for (const y of ys) {
      const left = clamp(x, size.width - labelWidth);
      const top = clamp(y, size.height - labelHeight);
      if (boxes.some(box => left + labelWidth > box.left && left < box.right &&
          top + labelHeight > box.top && top < box.bottom)) continue;
      const distance = Math.hypot(left + labelWidth / 2 - target.center, top + labelHeight / 2 - target.anchor);
      if (distance >= bestDistance) continue;
      bestDistance = distance;
      best = { left, top };
    }
  }

  host.dataset.annotation = best && size.width >= 500 ? 'inline' : 'compact';
  if (!best) return;
  element.style.left = best.left.toFixed(1) + 'px';
  element.style.top = best.top.toFixed(1) + 'px';
  element.dataset.pointer = target.center < best.left + labelWidth / 2 ? 'left' : 'right';
}

export default function StageAnnotation({ caption, paused }) {
  return <span className="workflow-annotation__text" data-paused={paused}>{caption}</span>;
}
