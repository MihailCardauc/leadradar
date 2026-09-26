'use client';
import { useState } from 'react';
import { useApp } from '../store';
import { Overlay, Skeleton } from '../components';

type ImportResult = { added: { name: string }[]; skipped: { row: number; name: string; reason: string }[] };
const SAMPLE = 'name,domain,legal_id,country,region,industry,employees,revenue\nBistrița Dairy SA,bistrita-dairy.example,,Romania,Bistrița-Năsăud,Food,140,22000000';

/** Import a company list (CSV) or add the reviewed real-company seed (evidence arrives as `review`). */
export function ImportSheet({ onClose }: { onClose: () => void }) {
  const { run, busy, view } = useApp();
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  async function readFile(f: File | undefined) { if (!f) return; if (f.size > 250000) { setCsv(''); return; } setCsv(await f.text()); }
  return <Overlay title="Import companies" onClose={onClose}>
    {busy ? <><Skeleton /><p className="small muted" style={{ marginTop: 'var(--s3)' }}>Adding companies as identity candidates and recalculating…</p></> : result ? <div className="stack">
      <p>{result.added.length} added as identity candidates{result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.</p>
      {result.skipped.length > 0 && <ul className="trace">{result.skipped.map(s => <li key={s.row}>Row {s.row} {s.name}: {s.reason}</li>)}</ul>}
      <p className="small muted">Next: open each company to verify its identity (ANAF for a CUI) and run research. Unknown is never negative.</p>
      <button className="btn primary" onClick={onClose}>Done</button>
    </div> : <div className="stack">
      <div className="drop">CSV with headers <code>name,domain</code> and optionally <code>legal_id,country,region,industry,employees,revenue,owner</code>.<br /><span className="small">Domain is the deduplication key; a legal identifier is stored but identity stays “candidate” until verified.</span></div>
      <label className="btn" style={{ cursor: 'pointer', alignSelf: 'start' }}>Choose file<input type="file" accept=".csv,text/csv" hidden onChange={e => readFile(e.target.files?.[0])} /></label>
      <label className="field"><span>Or paste CSV</span><textarea className="text" value={csv} onChange={e => setCsv(e.target.value)} placeholder={SAMPLE} /></label>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => setCsv(SAMPLE)}>Use example row</button>
        <button className="btn primary" disabled={csv.trim().length < 10} onClick={async () => { const r = await run<ImportResult>('companies-import', { csv }, x => `Imported ${x.added.length} compan${x.added.length === 1 ? 'y' : 'ies'}`); if (r) setResult(r); }}>Import CSV</button>
      </div>
      <div className="disc">Real-company seed: {view.mode === 'demo' ? '13 Romanian and international companies with public, dated quotes (register in docs/demo-seed-register.md). Rows arrive for review and do not score until a person validates them.' : 'available in demo workspaces.'}</div>
      <button className="btn" style={{ alignSelf: 'start' }} onClick={async () => { const r = await run<{ companies: number; evidenceAdded: number }>('demo-seed-apply', undefined, x => `Seed added · ${x.evidenceAdded} evidence rows waiting for review`); if (r) onClose(); }}>Add real-company seed (review rows)</button>
    </div>}
  </Overlay>;
}
