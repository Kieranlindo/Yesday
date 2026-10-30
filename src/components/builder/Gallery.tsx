'use client';
import { useCallback, useEffect, useState } from 'react';

type Photo = { url: string; alt: string };

/** The venue's photo grid. Any photo opens a full-screen viewer you can step through. */
export default function Gallery({ photos, name }: { photos: Photo[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const go = useCallback((d: number) => setOpen(i => (i == null ? i : (i + d + photos.length) % photos.length)), [photos.length]);
  useEffect(() => {
    if (open == null) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [open, go]);
  const shown = photos.slice(0, 3);
  return (
    <>
      <div className={`gal${shown.length === 2 ? ' two' : ''}`}>
        {shown.map((p, i) => (
          <button key={p.url} className="galb" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1} of ${photos.length}`}>
            <img src={p.url} alt={p.alt || (i ? '' : name)} />
          </button>
        ))}
        <button className="btn light sm galall" onClick={() => setOpen(0)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          See all {photos.length} photos
        </button>
      </div>
      {open != null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
          <button className="lbbg" aria-label="Close" onClick={() => setOpen(null)} />
          <img key={open} className="lbimg" src={photos[open].url} alt={photos[open].alt || name} />
          <div className="lbbar">
            <span className="small">{name}<span className="sep" />{open + 1} of {photos.length}</span>
            <div className="row g8">
              <button className="lbbtn" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
              <button className="lbbtn" onClick={() => go(1)} aria-label="Next photo">›</button>
              <button className="lbbtn" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
