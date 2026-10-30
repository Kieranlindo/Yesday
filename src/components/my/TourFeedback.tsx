'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { tourFeedback } from '@/app/actions';
import { toast } from '@/components/fx/Toaster';
import Burst from '@/components/fx/Burst';

const Star = () => <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>;
const VERDICTS = [['love', 'We love it'], ['maybe', 'Still deciding'], ['no', 'Not for us']] as const;

/** After a tour: a few stars, how they feel, and a note for the venue. */
export default function TourFeedback({ id, venue, manager, held }: { id: string; venue: string; manager: string; held: string | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [verdict, setVerdict] = useState<'love' | 'maybe' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const send = () => start(async () => {
    const r = await tourFeedback(id, rating, verdict!, note);
    if (r.error) { toast(r.error); return; }
    setDone(true); toast(`Thank you. ${manager} will see this.`);
    setTimeout(() => router.refresh(), verdict === 'love' ? 3200 : 1200);
  });
  if (done && verdict === 'love') return (
    <div className="card col g12" style={{ padding: 28, borderColor: 'var(--gold)' }}>
      <Burst confetti={false} />
      <span className="eyebrow">Wonderful</span>
      <h3 style={{ fontSize: 34 }}>{venue} it is?</h3>
      <p className="muted">{manager} will be in touch to confirm your date. Securing it with your deposit online arrives in the next stage of the build.</p>
    </div>
  );
  return (
    <div className="card col g16" style={{ padding: 28, borderColor: 'var(--gold)' }}>
      <div className="col g4"><span className="eyebrow">After your tour</span><h3 style={{ fontSize: 34 }}>How was {venue}?</h3>{held && <p className="small muted">{held}</p>}</div>
      <div className="stars" role="group" aria-label="Rate your tour">{[1, 2, 3, 4, 5].map(n => <button key={n} className={n <= rating ? 'on' : ''} aria-label={`${n} out of 5`} aria-pressed={n <= rating} onClick={() => setRating(n)}><Star /></button>)}</div>
      <div className="verdicts">{VERDICTS.map(([k, l]) => <button key={k} className={`tchip${verdict === k ? ' on' : ''}`} onClick={() => setVerdict(k)}>{l}</button>)}</div>
      <textarea className="inp ta" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={`Anything you’d like ${manager} to know?`} maxLength={1000} />
      <button className="btn gold" disabled={!rating || !verdict || pending} onClick={send}>{pending ? 'Sending…' : 'Send to ' + manager}</button>
    </div>
  );
}
