'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleLikeNow } from '@/app/actions';
import { toast } from './Toaster';

const Svg = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.4 5 6.6 5c2 0 3.4 1.2 4.1 2.3h2.6C14 6.2 15.4 5 17.4 5c3.2 0 5 3.3 3.6 6.4C19 15.6 12 20 12 20z" /></svg>;

/** A heart that fills and pops straight away, then saves in the background. */
export default function Heart({ venueId, name, liked: initial, back, variant = 'card' }: { venueId: string; name: string; liked: boolean; back: string; variant?: 'card' | 'pill' }) {
  const [liked, setLiked] = useState(initial);
  const [pop, setPop] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const click = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const next = !liked;
    setLiked(next); setPop(next);
    if (next) setTimeout(() => setPop(false), 500);
    start(async () => {
      const r = await toggleLikeNow(venueId, back);
      if (r.signIn) { setLiked(!next); router.push(r.signIn); return; }
      if (typeof r.liked === 'boolean') { setLiked(r.liked); toast(r.liked ? `${name} saved to your wedding` : `${name} removed from your liked venues`); }
    });
  };
  if (variant === 'pill') return (
    <button className={`btn o heartpill${liked ? ' on' : ''}${pop ? ' pop' : ''}`} aria-pressed={liked} onClick={click}><Svg size={17} />{liked ? 'Saved' : 'Save'}</button>
  );
  return (
    <button className={`heart${liked ? ' on' : ''}${pop ? ' pop' : ''}`} aria-pressed={liked} aria-label={liked ? `Remove ${name} from your liked venues` : `Like ${name}`} onClick={click}><Svg /></button>
  );
}
