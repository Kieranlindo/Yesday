'use client';
import { useState } from 'react';
import Link from 'next/link';
import VenueCardClient from './VenueCardClient';
import type { VenueCardData } from '@/lib/venues';

/** Liked venues, with a quiet way to pick two and compare them side by side. */
export default function LikedGrid({ list, day, guests, query }: { list: VenueCardData[]; day: string; guests: number; query: string }) {
  const [pick, setPick] = useState<string[]>([]);
  const tog = (slug: string) => setPick(p => (p.includes(slug) ? p.filter(x => x !== slug) : [...p.slice(-1), slug]));
  return (
    <>
      <div className="grid3 stagger" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {list.map(v => (
          <div key={v.id} style={{ position: 'relative' }}>
            <VenueCardClient v={v} day={day} guests={guests} query={query} />
            {list.length > 1 && <button className={`cmppick${pick.includes(v.slug) ? ' on' : ''}`} onClick={() => tog(v.slug)} aria-pressed={pick.includes(v.slug)}>{pick.includes(v.slug) ? '✓ Comparing' : 'Compare'}</button>}
          </div>
        ))}
      </div>
      {pick.length > 0 && (
        <div className="cmpbox" role="status">
          <span className="small">{pick.length === 1 ? 'Pick one more venue to compare' : 'Two venues picked'}</span>
          <Link className={`btn sm light${pick.length < 2 ? ' dis' : ''}`} aria-disabled={pick.length < 2} href={pick.length === 2 ? `/compare?a=${pick[0]}&b=${pick[1]}&${query}` : '#'} onClick={e => { if (pick.length < 2) e.preventDefault(); }}>Compare side by side</Link>
        </div>
      )}
    </>
  );
}
