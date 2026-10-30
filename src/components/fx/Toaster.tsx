'use client';
import { useEffect, useRef, useState } from 'react';

/** Shows a short message at the bottom of the screen. Call it from anywhere in the browser. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('yd:toast', { detail: message }));
}

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail); setShow(true);
      clearTimeout(timer.current); timer.current = setTimeout(() => setShow(false), 2800);
    };
    window.addEventListener('yd:toast', on);
    return () => window.removeEventListener('yd:toast', on);
  }, []);
  return (
    <div className={`toast${show ? ' show' : ''}`} role="status" aria-live="polite">
      <span className="tdot" aria-hidden="true" />{msg}
    </div>
  );
}
