import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, RefreshCw, Package, Boxes, Wrench, Zap, AlertTriangle,
} from 'lucide-react';
import { BomParts, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import FormFields from '@/components/crud/FormFields';
import CollapsibleSection from '@/components/ui/collapsible-section';
import Donut from '@/components/charts/Donut';
import StackedBarList from '@/components/charts/StackedBarList';
import { toast } from '@/components/toaster';
import {
  BOM_TYPE, BOM_COMMON, BOM_OST, BOM_FPA, BOM_MS, BUNITS, badgeForStatus,
} from '@/lib/constants';
import BomDetailSheet from './bom/DetailSheet';

const mainFields = (projOptions) => [
  { key: 'cat', label: 'Business Unit', type: 'select', options: BUNITS },
  {
    key: 'proj', label: 'Project', span: 2,
    ...(projOptions.length ? { type: 'select', options: projOptions } : {}),
  },
  { key: 'pno', label: 'Part Number' },
  { key: 'desc', label: 'Description', span: 2 },
  { key: 'type', label: 'Type', type: 'select', options: BOM_TYPE },
  { key: 'common', label: 'New / Old / ECN', type: 'select', options: BOM_COMMON },
  { key: 'qty', label: 'Qty per Assy' },
  { key: 'ost', label: 'Overall Status', type: 'select', options: BOM_OST },
  { key: 'mechLead', label: 'Mech Lead' },
  { key: 'sourcing', label: 'Sourcing Owner' },
  { key: 'commodity', label: 'Commodity' },
  { key: 'mfgProcess', label: 'Mfg Process' },
  { key: 'volumes', label: 'Volumes' },
  { key: 'toolMaker', label: 'Tool Maker' },
  { key: 'partMaker', label: 'Part Maker' },
  { key: 'fpaStatus', label: 'FPA Status', type: 'select', options: BOM_FPA },
  { key: 'fpaNumber', label: 'FPA Number' },
  { key: 'cavity', label: 'Cavity' },
  { key: 'tonnage', label: 'Tonnage' },
  { key: 'machineMake', label: 'Machine Make' },
  { key: 'cycleTime', label: 'Cycle Time' },
];

const DEV_CATS = [
  ['Completed', '#059669'],
  ['On Track', '#2563eb'],
  ['At Risk', '#ea580c'],
  ['Delayed', '#dc2626'],
  ['Other', '#94a3b8'],
];
const devCat = (ost = '') => {
  const s = ost.toLowerCase();
  if (s.includes('completed')) return 'Completed';
  if (s === 'on track') return 'On Track';
  if (s === 'at risk') return 'At Risk';
  if (s === 'delayed') return 'Delayed';
  return 'Other';
};
const fpaCat = (fpaStatus = '') => {
  if (/approved/i.test(fpaStatus)) return 'Approved';
  if (/pending/i.test(fpaStatus)) return 'Pending';
  return 'Other';
};

const ensureMs = (ms) => {
  const out = {};
  BOM_MS.forEach(([k]) => { out[k] = { plan: ms?.[k]?.plan || '', actual: ms?.[k]?.actual || '' }; });
  return out;
};
const msDoneCount = (r) => BOM_MS.filter(([k]) => r.ms?.[k]?.actual).length;

function Tile({ icon: Icon, color, value, label }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0" style={{ background: `${color}18`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs font-medium mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const defaults = { type: 'Dev', common: 'New' };

export default function BomPage() {
  const [rows, setRows] = useState([]);
  const [npds, setNpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [projFilter, setProjFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('home');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await BomParts.list());
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    Npds.list().then(setNpds).catch(() => {});
  }, []);

  const projOptions = useMemo(() => {
    const fromNpd = npds.map((n) => n.name);
    const fromRows = rows.map((r) => r.proj).filter(Boolean);
    return [...new Set([...fromNpd, ...fromRows])];
  }, [npds, rows]);

  const fields = useMemo(() => mainFields(projOptions), [projOptions]);

  const searchKeys = ['proj', 'pno', 'desc', 'toolMaker', 'partMaker', 'sourcing'];
  const filtered = useMemo(() => {
    let list = rows;
    if (projFilter) list = list.filter((r) => r.proj === projFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(s)));
    }
    return list;
  }, [rows, q, projFilter]);

  // ── Portfolio-wide stats & charts (always computed from all parts) ──
  const dev = rows.filter((b) => b.type === 'Dev').length;
  const bo = rows.filter((b) => b.type === 'BO').length;
  const assy = rows.filter((b) => b.type === 'Assy').length;
  const fpaApproved = rows.filter((b) => /approved/i.test(b.fpaStatus || '')).length;
  const delayed = rows.filter((b) => devCat(b.ost) === 'Delayed').length;

  const typeSegs = [
    { label: 'Dev', value: dev, color: '#2563eb' },
    { label: 'BO', value: bo, color: '#7c3aed' },
    { label: 'Assembly', value: assy, color: '#0891b2' },
  ];
  const newCnt = rows.filter((b) => b.common === 'New').length;
  const oldCnt = rows.filter((b) => b.common === 'Old').length;
  const ecnCnt = rows.filter((b) => b.common === 'ECN').length;
  const neSegs = [
    { label: 'New', value: newCnt, color: '#2563eb' },
    { label: 'Existing', value: oldCnt, color: '#64748b' },
    { label: 'ECN', value: ecnCnt, color: '#f59e0b' },
  ];
  const fpaApprovedAll = rows.filter((b) => fpaCat(b.fpaStatus) === 'Approved').length;
  const fpaPendingAll = rows.filter((b) => fpaCat(b.fpaStatus) === 'Pending').length;
  const fpaOtherAll = rows.length - fpaApprovedAll - fpaPendingAll;
  const fpaSegs = [
    { label: 'Approved', value: fpaApprovedAll, color: '#059669' },
    { label: 'Pending', value: fpaPendingAll, color: '#f59e0b' },
    { label: 'Other / N-A', value: fpaOtherAll, color: '#cbd5e1' },
  ];

  const projects = [...new Set(rows.map((b) => b.proj).filter(Boolean))];
  const devStatusItems = projects.map((pr) => {
    const arr = rows.filter((b) => b.proj === pr);
    return {
      label: pr,
      segments: DEV_CATS.map(([name, color]) => ({
        value: arr.filter((b) => devCat(b.ost) === name).length, color, title: name,
      })),
    };
  });
  const fpaByProjectItems = projects.map((pr) => {
    const arr = rows.filter((b) => b.proj === pr);
    return {
      label: pr,
      segments: [
        { value: arr.filter((b) => fpaCat(b.fpaStatus) === 'Approved').length, color: '#059669', title: 'Approved' },
        { value: arr.filter((b) => fpaCat(b.fpaStatus) === 'Pending').length, color: '#f59e0b', title: 'Pending' },
        { value: arr.filter((b) => fpaCat(b.fpaStatus) === 'Other').length, color: '#cbd5e1', title: 'Other / N-A' },
      ],
    };
  });

  const pipeline = BOM_MS.map(([key, label]) => {
    const done = rows.filter((b) => b.ms?.[key]?.actual).length;
    const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
    return { key, label, done, pct };
  });

  const flagged = rows.filter((b) => b.ost === 'Delayed' || b.ost === 'At Risk').slice(0, 8);

  // ── CRUD ──
  const openCreate = (proj) => { setEditing(null); setValues({ ...defaults, proj: proj || '', ms: ensureMs() }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); setValues({ ...row, ms: ensureMs(row.ms) }); setOpen(true); };
  const setMs = (key, kind, val) => setValues((v) => ({ ...v, ms: { ...v.ms, [key]: { ...v.ms?.[key], [kind]: val } } }));

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await BomParts.update(editing.id, values);
        setRows((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
        toast('Updated', 'success');
      } else {
        const created = await BomParts.create(values);
        setRows((prev) => [...prev, created]);
        toast('Created', 'success');
      }
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm('Delete this part? This cannot be undone.')) return;
    try {
      await BomParts.remove(editing.id);
      setRows((prev) => prev.filter((r) => r.id !== editing.id));
      toast('Deleted', 'success');
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  if (view === 'detail') {
    return (
      <BomDetailSheet
        projects={projects}
        onAdd={(proj) => { setView('home'); openCreate(proj); }}
        onBack={() => setView('home')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">BOM Tracking</h1>
          <p className="text-sm text-muted-foreground">Bill of materials per project — parts, suppliers, tooling &amp; FPA milestones</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => setView('detail')}>Open Detailed Tracker →</Button>
        <Button onClick={() => openCreate()}><Plus /> Add Part</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Tile icon={Package} color="#0f172a" value={rows.length} label="Total Parts" />
        <Tile icon={Package} color="#2563eb" value={dev} label="Dev Parts" />
        <Tile icon={Boxes} color="#7c3aed" value={bo} label="BO Parts" />
        <Tile icon={Wrench} color="#0891b2" value={assy} label="Assembly" />
        <Tile icon={Zap} color="#059669" value={fpaApproved} label="FPA Approved" />
        <Tile icon={AlertTriangle} color={delayed ? '#dc2626' : '#059669'} value={delayed} label="Delayed" />
      </div>

      <CollapsibleSection title="Charts & analytics — BOM portfolio">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Parts by Type</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-6 flex-wrap justify-center">
              <Donut segments={typeSegs} centerLabel="parts" />
              <div className="space-y-1 text-xs">
                {typeSegs.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                    {s.label} <b>{s.value}</b>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">New vs Existing Parts</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-6 flex-wrap justify-center">
              <Donut segments={neSegs} centerLabel="parts" />
              <div className="space-y-1 text-xs">
                {neSegs.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                    {s.label} <b>{s.value}</b>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Project-wise Development Status</CardTitle></CardHeader>
            <CardContent>
              <StackedBarList items={devStatusItems} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-3">
                {DEV_CATS.map(([name, color]) => (
                  <span key={name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: color }} />{name}</span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">FPA Status by Project</CardTitle></CardHeader>
            <CardContent>
              <StackedBarList items={fpaByProjectItems} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-3">
                {fpaSegs.map((s) => (
                  <span key={s.label} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: s.color }} />{s.label}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Development Pipeline</CardTitle>
            <span className="text-[11px] text-muted-foreground">Parts that cleared each milestone</span>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pipeline.map((m) => (
              <div key={m.key} className="flex items-center gap-2 text-xs">
                <div className="w-56 shrink-0 text-muted-foreground truncate" title={m.label}>{m.label}</div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${m.pct}%` }} />
                </div>
                <div className="w-10 text-right font-medium">{m.done}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Parts Flagged — Delayed / At Risk</CardTitle></CardHeader>
          <CardContent>
            {flagged.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No delays or at-risk parts 🎉</p>
            ) : (
              <div className="space-y-2">
                {flagged.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs p-2 rounded bg-red-50 cursor-pointer" onClick={() => openEdit(b)}>
                    <span className="font-medium">{b.pno} · {b.desc}</span>
                    <Badge variant="outline" className={badgeForStatus(b.ost)}>{b.ost}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleSection>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={projFilter || '__all'} onValueChange={(v) => setProjFilter(v === '__all' ? '' : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Projects</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search parts…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Reload"><RefreshCw className="h-4 w-4" /></Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">Showing {filtered.length} of {rows.length} parts</span>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {error}. Is the backend running on port 4000?
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Part No.</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>New/Old</TableHead>
            <TableHead>Sourcing</TableHead>
            <TableHead>Tool Maker</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>FPA</TableHead>
            <TableHead>Milestones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No parts yet</TableCell></TableRow>
          ) : filtered.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
              <TableCell>{r.proj || '—'}</TableCell>
              <TableCell className="font-medium">{r.pno || '—'}</TableCell>
              <TableCell className="max-w-[220px] truncate" title={r.desc}>{r.desc || '—'}</TableCell>
              <TableCell>{r.type || '—'}</TableCell>
              <TableCell>{r.common || '—'}</TableCell>
              <TableCell>{r.sourcing || '—'}</TableCell>
              <TableCell>{r.toolMaker || '—'}</TableCell>
              <TableCell>{r.ost ? <Badge variant="outline" className={badgeForStatus(r.ost)}>{r.ost}</Badge> : '—'}</TableCell>
              <TableCell>{r.fpaStatus ? <Badge variant="outline" className={badgeForStatus(r.fpaStatus)}>{r.fpaStatus}</Badge> : '—'}</TableCell>
              <TableCell className="text-muted-foreground">{msDoneCount(r)}/{BOM_MS.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Part — ${editing.pno || ''}` : 'Add Part'}</DialogTitle>
          </DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />

          <div className="space-y-2">
            <span className="text-sm font-medium">Milestones</span>
            <div className="rounded-md border divide-y">
              <div className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-1.5 text-[11px] font-medium text-muted-foreground bg-muted/50">
                <span>Milestone</span><span>Plan</span><span>Actual</span>
              </div>
              {BOM_MS.map(([key, label]) => (
                <div key={key} className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-1.5 items-center text-xs">
                  <span className="truncate" title={label}>{label}</span>
                  <Input type="date" className="h-7 text-xs" value={values.ms?.[key]?.plan || ''} onChange={(e) => setMs(key, 'plan', e.target.value)} />
                  <Input type="date" className="h-7 text-xs" value={values.ms?.[key]?.actual || ''} onChange={(e) => setMs(key, 'actual', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" onClick={remove} className="mr-auto">Delete</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
