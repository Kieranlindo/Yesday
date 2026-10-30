'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelTour, demoFinishTour } from '@/app/actions';
import { toast } from '@/components/fx/Toaster';

export default function TourActions({ id, past }: { id: string; past: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="row g16 wrapr small">
      {!past && <button className="link" disabled={pending} onClick={() => start(async () => { await demoFinishTour(id); toast('Demo: your tour is now in the past'); router.refresh(); })}>Demo: skip to after the tour</button>}
      <button className="link" style={{ color: 'var(--mute)' }} disabled={pending} onClick={() => { if (confirm('Cancel this tour? Your held date will be released.')) start(async () => { await cancelTour(id); toast('Tour cancelled'); router.refresh(); }); }}>Cancel tour</button>
    </div>
  );
}
