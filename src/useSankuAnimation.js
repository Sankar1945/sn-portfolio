import { useCallback, useEffect, useState } from 'react';

const assets = {
  idle: ['sanku_idle.png', 0],
  wave: ['sanku_wave.apng', 1020],
  thinking: ['sanku_thinking.apng', 1520],
  explaining: ['sanku_explaining.apng', 1200],
  celebration: ['sanku_celebration.apng', 1120],
  shhh: ['sanku_shhh.apng', 2390],
};

const urlFor = (pose) => '/mascot/' + encodeURIComponent(assets[pose][0]);
const prepared = new Map();

export function prepare(pose) {
  const path = urlFor(pose);
  if (!prepared.has(path)) {
    prepared.set(path, fetch(path).then((response) => {
      if (!response.ok) throw new Error('Sanku asset unavailable');
      return response.blob();
    }).catch((error) => {
      prepared.delete(path);
      throw error;
    }));
  }
  return prepared.get(path);
}

export function useSankuAnimation(reduced, initialPose = 'wave') {
  const [request, requestPose] = useState(initialPose);
  const [animation, setAnimation] = useState(null);
  const play = useCallback((pose) => requestPose({ pose }), []);
  const pose = typeof request === 'string' ? request : request.pose;

  useEffect(() => {
    if (reduced || pose === 'idle') return;

    let cancelled = false;
    let objectUrl;
    prepare(pose).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setAnimation({ request, url: objectUrl });
    }).catch(() => { if (!cancelled) play('idle'); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request, pose, reduced, play]);

  const current = !reduced && animation?.request === request ? animation : null;
  const [loadedUrl, setLoadedUrl] = useState(null);
  useEffect(() => {
    if (!current || loadedUrl !== current.url) return;
    let timer;
    let nextFrame;
    // Give the decoded APNG a paint before timing its one-shot sequence.
    const frame = window.requestAnimationFrame(() => {
      nextFrame = window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => play('idle'), assets[pose][1] + 120);
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nextFrame);
      window.clearTimeout(timer);
    };
  }, [current, loadedUrl, play, pose]);

  return {
    busy: !reduced && pose !== 'idle',
    pose: current ? pose : 'idle',
    src: current?.url ?? urlFor('idle'),
    play,
    cancelPending: (expectedPose) => {
      if (pose === expectedPose && (!current || loadedUrl !== current.url)) play('idle');
    },
    loaded: (event) => setLoadedUrl(event.currentTarget.src),
  };
}
