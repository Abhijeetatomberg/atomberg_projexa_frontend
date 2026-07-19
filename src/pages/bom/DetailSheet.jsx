import { Fragment, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { BomParts } from '@/api/resources';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BOM_TYPE, BOM_COMMON, BOM_OST, BOM_FPA, BOM_MS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

// Which visual "stage" tint each milestone column belongs to — mirrors the legacy sheet's
// definition / design / tooling / validation / FPA column groups.
const BOM_STAGE = {
  drawing: 'design', supplierId: 'design', toolOnboard: 'tool', dfmInit: 'tool',
  dfmClosure: 'tool', commercial: 'tool', tmko: 'tool', toolReady: 'tool', toolT0: 'tool',
  partsReceipt: 'val', fpaClosureAic: 'val', partSupplierFpa: 'val', ppap: 'val',
};
const STAGE_HEAD = { def: 'bg-slate-300', design: 'bg-blue-200', tool: 'bg-amber-200', val: 'bg-emerald-200', fpa: 'bg-violet-200' };
const STAGE_CELL = { def: '', design: 'bg-blue-50/60', tool: 'bg-amber-50/60', val: 'bg-emerald-50/60', fpa: 'bg-violet-50/60' };

// A part is "locked" (development dates no longer relevant) once it's an assembly, an
// existing/old part, or its overall status reads as existing/standard — mirrors bomLocked().
const isLocked = (b) => b.type === 'Assy' || b.common === 'Old' || /existing|standard/i.test(b.ost || '');
const isDone = (b) => /completed/i.test(b.ost || '');
const statusRowClass = (b) => {
  const s = (b.ost || '').toLowerCase();
  if (/at risk/.test(s)) return 'bg-red-100/70';
  if (/delay/.test(s) && /complet/.test(s)) return 'bg-emerald-100/70 text-red-700';
  if (/complet/.test(s)) return 'bg-emerald-100/70';
  if (/delay/.test(s)) return 'bg-red-50';
  if (/existing|standard/.test(s)) return 'bg-emerald-50/50';
  return '';
};

function TextCell({ value, onChange, disabled, wide }) {
  if (disabled) return <span className="block text-xs px-1 py-1 min-h-[26px]">{value || ''}</span>;
  return (
    <input
      className={cn('w-full bg-transparent text-xs px-1 py-1 outline-none focus:bg-white rounded', wide ? 'text-left' : 'text-center')}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
function SelectCell({ value, opts, onChange, disabled }) {
  if (disabled) return <span className="block text-xs px-1 py-1 min-h-[26px]">{value || ''}</span>;
  return (
    <select className="w-full bg-transparent text-xs px-1 py-1 outline-none focus:bg-white rounded text-center" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      {opts.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
    </select>
  );
}
function DateCell({ value, onChange, disabled }) {
  if (disabled) return <span className="block text-[10px] px-1 py-1 min-h-[26px]">{value || ''}</span>;
  return <input type="date" className="w-full bg-transparent text-[10px] px-1 py-1 outline-none focus:bg-white rounded" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}

export default function BomDetailSheet({ projects, onAdd, onBack }) {
  const [proj, setProj] = useState(projects[0] || '');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    BomParts.list().then((all) => setRows(proj ? all.filter((r) => r.proj === proj) : all)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [proj]);

  const set = (row, field, val) => {
    const next = { ...row, [field]: val };
    setRows((prev) => prev.map((r) => (r.id === row.id ? next : r)));
    BomParts.update(row.id, { [field]: val }).catch(() => {});
  };
  const setMs = (row, key, kind, val) => {
    const ms = { ...(row.ms || {}), [key]: { ...(row.ms?.[key] || {}), [kind]: val } };
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ms } : r)));
    BomParts.update(row.id, { ms }).catch(() => {});
  };
  const removeRow = async (row) => {
    if (!confirm(`Delete part "${row.pno || row.desc}"?`)) return;
    await BomParts.remove(row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const ro = !proj; // no project selected — read-only overview across everything

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <h2 className="text-lg font-bold">BOM Tracker <span className="text-muted-foreground font-normal">› Detailed Sheet</span></h2>
        <div className="flex-1" />
        <Select value={proj || '__all'} onValueChange={(v) => setProj(v === '__all' ? '' : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Projects (read-only)</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {!ro && <Button size="sm" onClick={() => onAdd(proj)}><Plus className="h-4 w-4" /> Add Part</Button>}
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2 py-0.5 rounded font-medium bg-slate-300">Definition</span>
        <span className="px-2 py-0.5 rounded font-medium bg-blue-200">Design</span>
        <span className="px-2 py-0.5 rounded font-medium bg-amber-200">Tooling</span>
        <span className="px-2 py-0.5 rounded font-medium bg-emerald-200">Validation</span>
        <span className="px-2 py-0.5 rounded font-medium bg-violet-200">FPA &amp; Specs</span>
      </div>
      {ro && <p className="text-xs text-muted-foreground">Read-only overview across all projects — select a project above to edit parts inline.</p>}

      <div className="rounded-md border overflow-auto max-h-[75vh]">
        <table className="border-collapse text-xs w-max min-w-full">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-slate-800 text-white px-2 py-2 min-w-[90px]">Part No</th>
              <th className="sticky top-0 z-20 bg-slate-800 text-white px-2 py-2 min-w-[220px] text-left" style={{ left: 90 }}>Description</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[80px]', STAGE_HEAD.def)}>Type</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[64px]', STAGE_HEAD.def)}>Qty</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[80px]', STAGE_HEAD.def)}>New/Old</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[110px]', STAGE_HEAD.def)}>Overall Status</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[100px]', STAGE_HEAD.def)}>Sourcing</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[100px]', STAGE_HEAD.def)}>Tool Maker</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[100px]', STAGE_HEAD.def)}>Part Maker</th>
              {BOM_MS.map(([key, label]) => (
                <th key={key} colSpan={2} className={cn('sticky top-0 z-10 px-2 py-2 min-w-[150px]', STAGE_HEAD[BOM_STAGE[key]])}>{label}</th>
              ))}
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[110px]', STAGE_HEAD.fpa)}>FPA Status</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[90px]', STAGE_HEAD.fpa)}>FPA No.</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[70px]', STAGE_HEAD.fpa)}>Cavity</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[80px]', STAGE_HEAD.fpa)}>Tonnage</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[100px]', STAGE_HEAD.fpa)}>Machine</th>
              <th className={cn('sticky top-0 z-10 px-2 py-2 min-w-[80px]', STAGE_HEAD.fpa)}>Cycle</th>
              {!ro && <th className="sticky top-0 z-10 px-2 py-2 w-10" />}
            </tr>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-800" style={{ top: 34 }} />
              <th className="sticky z-20 bg-slate-800" style={{ top: 34, left: 90 }} />
              {Array.from({ length: 7 }).map((_, i) => <th key={i} className={cn('sticky z-10', STAGE_HEAD.def)} style={{ top: 34 }} />)}
              {BOM_MS.map(([key]) => (
                <Fragment key={key}>
                  <th className={cn('sticky z-10 text-[9px] font-medium', STAGE_HEAD[BOM_STAGE[key]])} style={{ top: 34 }}>Plan</th>
                  <th className={cn('sticky z-10 text-[9px] font-medium', STAGE_HEAD[BOM_STAGE[key]])} style={{ top: 34 }}>Actual</th>
                </Fragment>
              ))}
              {Array.from({ length: 6 }).map((_, i) => <th key={i} className={cn('sticky z-10', STAGE_HEAD.fpa)} style={{ top: 34 }} />)}
              {!ro && <th className="sticky z-10" style={{ top: 34 }} />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={30} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={30} className="text-center py-8 text-muted-foreground">No parts yet.</td></tr>
            ) : rows.map((b) => {
              const locked = isLocked(b);
              const done = isDone(b);
              const rowRo = ro || (locked && done);
              return (
                <tr key={b.id} className={cn('border-b hover:bg-slate-50/70', statusRowClass(b))}>
                  <td className="sticky left-0 bg-white border-r px-1">{rowRo ? <span className="block text-xs px-1 py-1">{b.pno}</span> : <TextCell value={b.pno} onChange={(v) => set(b, 'pno', v)} />}</td>
                  <td className="sticky bg-white border-r px-1 text-left" style={{ left: 90 }}>{rowRo ? <span className="block text-xs px-1 py-1">{b.desc}</span> : <TextCell value={b.desc} onChange={(v) => set(b, 'desc', v)} wide />}</td>
                  <td className={STAGE_CELL.def}><SelectCell value={b.type} opts={BOM_TYPE} disabled={rowRo} onChange={(v) => set(b, 'type', v)} /></td>
                  <td className={STAGE_CELL.def}><TextCell value={b.qty} disabled={rowRo} onChange={(v) => set(b, 'qty', v)} /></td>
                  <td className={STAGE_CELL.def}><SelectCell value={b.common} opts={BOM_COMMON} disabled={rowRo} onChange={(v) => set(b, 'common', v)} /></td>
                  <td className={STAGE_CELL.def}><SelectCell value={b.ost} opts={BOM_OST} disabled={ro} onChange={(v) => set(b, 'ost', v)} /></td>
                  <td className={STAGE_CELL.def}><TextCell value={b.sourcing} disabled={rowRo} onChange={(v) => set(b, 'sourcing', v)} /></td>
                  <td className={STAGE_CELL.def}><TextCell value={b.toolMaker} disabled={rowRo} onChange={(v) => set(b, 'toolMaker', v)} /></td>
                  <td className={STAGE_CELL.def}><TextCell value={b.partMaker} disabled={rowRo} onChange={(v) => set(b, 'partMaker', v)} /></td>
                  {BOM_MS.map(([key]) => {
                    const cls = STAGE_CELL[BOM_STAGE[key]];
                    const v = b.ms?.[key] || {};
                    const late = v.plan && v.actual && v.actual > v.plan;
                    return (
                      <Fragment key={key}>
                        <td className={cls}><DateCell value={v.plan} disabled={rowRo} onChange={(val) => setMs(b, key, 'plan', val)} /></td>
                        <td className={cn(cls, late && 'bg-red-200/70')}><DateCell value={v.actual} disabled={rowRo} onChange={(val) => setMs(b, key, 'actual', val)} /></td>
                      </Fragment>
                    );
                  })}
                  <td className={STAGE_CELL.fpa}><SelectCell value={b.fpaStatus} opts={BOM_FPA} disabled={ro} onChange={(v) => set(b, 'fpaStatus', v)} /></td>
                  <td className={STAGE_CELL.fpa}><TextCell value={b.fpaNumber} disabled={ro} onChange={(v) => set(b, 'fpaNumber', v)} /></td>
                  <td className={STAGE_CELL.fpa}><TextCell value={b.cavity} disabled={rowRo} onChange={(v) => set(b, 'cavity', v)} /></td>
                  <td className={STAGE_CELL.fpa}><TextCell value={b.tonnage} disabled={rowRo} onChange={(v) => set(b, 'tonnage', v)} /></td>
                  <td className={STAGE_CELL.fpa}><TextCell value={b.machineMake} disabled={rowRo} onChange={(v) => set(b, 'machineMake', v)} /></td>
                  <td className={STAGE_CELL.fpa}><TextCell value={b.cycleTime} disabled={rowRo} onChange={(v) => set(b, 'cycleTime', v)} /></td>
                  {!ro && (
                    <td className="text-center">
                      <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => removeRow(b)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
