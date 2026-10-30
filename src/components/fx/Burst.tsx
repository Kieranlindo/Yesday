'use client';
import { useEffect, useState } from 'react';

const STAR = <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor" /></svg>;

/** Gold sparkles and falling confetti, for the moments that deserve it. */
export default function Burst({ confetti = true }: { confetti?: boolean }) {
  const [bits, setBits] = useState<{ k: number; style: React.CSSProperties; star: boolean }[]>([]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const golds = ['#C5A35C', '#E9D5A0', '#B8963F', '#F4EDDD', '#15130F'];
    const out: typeof bits = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, r = 120 + Math.random() * 160;
      out.push({ k: i, star: true, style: { left: '50%', top: '38%', width: 10 + Math.random() * 14, height: 10 + Math.random() * 14, ['--x' as string]: `${Math.cos(a) * r}px`, ['--y' as string]: `${Math.sin(a) * r}px`, ['--d' as string]: `${Math.random() * 0.25}s` } });
    }
    if (confetti) for (let i = 0; i < 70; i++) {
      out.push({ k: 100 + i, star: false, style: { left: `${Math.random() * 100}%`, width: 6 + Math.random() * 6, height: 10 + Math.random() * 8, background: golds[i % golds.length], ['--r' as string]: `${(Math.random() - 0.5) * 1080}deg`, animationDuration: `${2.6 + Math.random() * 2.2}s`, animationDelay: `${Math.random() * 0.9}s` } });
    }
    setBits(out);
    const t = setTimeout(() => setBits([]), 5600);
    return () => clearTimeout(t);
  }, [confetti]);
  return <div className="burst" aria-hidden="true">{bits.map(b => b.star ? <span key={b.k} className="spk" style={b.style}>{STAR}</span> : <span key={b.k} className="cf" style={b.style} />)}</div>;
}
