'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Small presentational building blocks of the design system (classes from globals.css). */
export function Stat({ label, value, unit, sub, tone, corner, large }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode; tone?: 'positive' | 'attention' | 'orange'; corner?: ReactNode; large?: boolean }) {
  return <div className={`stat ${tone ?? ''} ${large ? 'lg' : ''}`}><div className="lbl">{label}</div><div className="val tnum"><span>{value}</span>{unit && <span className="unit">{unit}</span>}</div>{sub && <div className="sub">{sub}</div>}{corner && <span className="corner">{corner}</span>}</div>;
}
export function Badge({ tone = '', children, title }: { tone?: string; children: ReactNode; title?: string }) { return <span className={`badge ${tone}`} title={title}>{children}</span>; }

export function Tabs<K extends string>({ items, value, onChange, dark, label }: { items: [K, ReactNode][]; value: K; onChange: (k: K) => void; dark?: boolean; label: string }) {
  return <div className={`tabs ${dark ? 'dark' : ''}`} role="tablist" aria-label={label}>
    {items.map(([k, l]) => <button key={k} className="tab" role="tab" aria-selected={k === value} data-s={k} onClick={() => onChange(k)}>{l}</button>)}
  </div>;
}

export function Icon({ name }: { name: 'bell' | 'moon' | 'gear' | 'close' | 'search' | 'arrow' | 'out' }) {
  const paths: Record<string, ReactNode> = {
    bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></>,
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    arrow: <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    out: <><path d="M14 4h5v16h-5" /><path d="M10 12h10M7 8l-4 4 4 4" /></>,
  };
  return <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function Logo({ faint }: { faint?: boolean }) {
  return <svg viewBox="245 195 532 632" aria-hidden="true"><polygon points="295,333 384,245 384,689 620,689 708,777 295,777" fill={faint ? 'var(--ink-faint)' : 'var(--ink)'} /><polygon points="590,333 727,412 453,570 453,412" fill={faint ? 'var(--ink-faint)' : 'var(--ink)'} /><polygon points="727,412 727,570 590,650 453,570" fill={faint ? 'var(--surface-300)' : '#88888c'} /></svg>;
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <label className="input" style={{ maxWidth: 320 }}><span className="sr-only">{placeholder}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /><span className="iic"><Icon name="search" /></span></label>;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="empty"><Logo faint /><h2>{title}</h2>{children && <p className="muted">{children}</p>}{action}</div>;
}
export function Skeleton({ rows = 3 }: { rows?: number }) { return <div className="stack" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <div key={i} className="skel" />)}</div>; }
export function ErrorBand({ children, action }: { children: ReactNode; action?: ReactNode }) { return <div className="errband" role="alert"><span>{children}</span>{action}</div>; }

export function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null; ref.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [onClose]);
  return <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet" ref={ref}>
      <div className="head" style={{ marginBottom: 'var(--s4)' }}><h2>{title}</h2><button className="ibtn filled" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div>
      {children}
    </div>
  </div>;
}

/** Inline required-reason picker used by every reject flow (reasons feed recalibration). */
export function ReasonPicker({ reasons, onPick, onBack, busy }: { reasons: readonly string[]; onPick: (r: string) => void; onBack: () => void; busy?: boolean }) {
  const [other, setOther] = useState('');
  return <div className="reason" style={{ flex: '1 1 100%' }}>
    <div className="label">Reason (required)</div>
    <div className="row" style={{ gap: 'var(--s2)' }}>{reasons.filter(r => r !== 'Other').map(r => <button key={r} className="chip" disabled={busy} onClick={() => onPick(r)}>{r}</button>)}</div>
    <div className="row" style={{ gap: 'var(--s2)' }}><input className="text" style={{ flex: '1 1 200px' }} placeholder="Other reason" value={other} onChange={e => setOther(e.target.value)} /><button className="btn sm" disabled={busy || other.trim().length < 3} onClick={() => onPick(other.trim())}>Use</button><button className="btn sm" onClick={onBack}>Back</button></div>
  </div>;
}

/** Scrolls a detail sheet into view when the selected record changes (respects reduced motion). */
export function useRevealOnChange<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' }), 60);
    // Some embedded webviews ignore smooth scrolling: fall back to an instant jump if the sheet is still off-screen.
    const f = setTimeout(() => { const r = ref.current?.getBoundingClientRect(); if (r && (r.top >= innerHeight || r.bottom <= 0)) ref.current?.scrollIntoView({ block: 'start' }); }, 700);
    return () => { clearTimeout(t); clearTimeout(f); };
  }, [key]);
  return ref;
}

export function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Count-up animation from the design (respects reduced motion). */
export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const instant = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0; const t0 = performance.now();
    const f = (t: number) => { const k = instant ? 1 : Math.min(1, (t - t0) / 1200); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    // Background tabs pause animation frames: always land on the true value.
    const done = setTimeout(() => setN(to), 1300);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [to]);
  return <>{n.toLocaleString('en')}</>;
}
