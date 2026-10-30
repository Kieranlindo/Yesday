'use client';
import { useEffect, useState } from 'react';

/** The header floats over the hero photo, then turns solid once you scroll, so it's always readable. */
export default function NavShell({ over, children }: { over: boolean; children: React.ReactNode }) {
  const [solid, setSolid] = useState(!over);
  useEffect(() => {
    if (!over) return;
    const on = () => setSolid(window.scrollY > 40);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [over]);
  return <header className={`nav${over && !solid ? ' over' : ''}${over ? ' floats' : ''}`}>{children}</header>;
}
