'use client';
import { useEffect, useState } from 'react';

/** Cross-fades the hero photographs every seven seconds. Only large, sharp photos are passed in. */
export default function HeroRotator({ photos }: { photos: { src: string; credit: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (photos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!document.hidden) setI(n => (n + 1) % photos.length); }, 7000);
    return () => clearInterval(t);
  }, [photos.length]);
  return (
    <>
      {photos.map((p, n) => <div key={p.src} className={`bg${n === i ? ' on' : ''}`} style={{ backgroundImage: `url(${p.src})` }} aria-hidden="true" />)}
      <div className="shade" />
      <span className="credit">{photos[i]?.credit}</span>
    </>
  );
}
