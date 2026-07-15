import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, FlaskConical, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Trials } from '@/api/resources';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import {
  TRIAL_SECTION, TRIAL_DEPT, TRIAL_TYPE, TRIAL_STATUS, HOD_ROLES, badgeForStatus,
} from '@/lib/constants';
import { cn, fmtDate, todayIso } from '@/lib/utils';

const STAT_TILES = [
  { status: 'Draft', label: 'Draft', icon: FlaskConical, color: 'text-slate-600', bg: 'bg-slate-100' },
  { status: 'Submitted', label: 'Submitted', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  { status: 'In Process', label: 'In Process (signatures)', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  { status: 'Closed', label: 'Closed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
];

const fields = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'section', label: 'Section', type: 'select', options: TRIAL_SECTION },
  { key: 'dept', label: 'Department', type: 'select', options: TRIAL_DEPT },
  { key: 'trialType', label: 'Trial Type', type: 'select', options: TRIAL_TYPE },
  { key: 'project', label: 'Project' },
  { key: 'qty', label: 'Quantity' },
  { key: 'objective', label: 'Objective', type: 'textarea' },
  { key: 'drawingAvail', label: 'Drawing Available?', type: 'select', options: ['Yes', 'No', 'NA'] },
  { key: 'drawingNoRev', label: 'Drawing No. / Rev' },
  { key: 'bomPartsAvail', label: 'BOM Parts Available?', type: 'select', options: ['Yes', 'No', 'Partial'] },
  { key: 'majorParts', label: 'Major Parts' },
];

export default function TrialPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    Trials.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      (!sectionFilter || r.section === sectionFilter) &&
      (!deptFilter || r.dept === deptFilter) &&
      (!typeFilter || r.trialType === typeFilter) &&
      (!q || `${r.trialNo} ${r.project} ${r.originator} ${r.dept} ${r.section} ${r.objective}`.toLowerCase().includes(q.toLowerCase()))
    ),
    [rows, q, statusFilter, sectionFilter, deptFilter, typeFilter]
  );

  const counts = useMemo(() => {
    const c = {};
    rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [rows]);

  const create = async () => {
    try {
      const seq = rows.length + 1;
      const trialNo = `TR-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
      const c = await Trials.create({
        ...values,
        trialNo,
        date: values.date || todayIso(),
        originator: user?.name || user?.username || '',
        status: 'Draft',
      });
      toast(`Trial ${c.trialNo} created as Draft`, 'success');
      setOpen(false);
      navigate(`/trials/${c.id}`);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const approvals = (r) => HOD_ROLES.filter(([k]) => r.hod?.[k] === 'Approved').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Trial Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Trial Request & Approval Tracking — cross-functional sign-off across Production, R&D, PED, QA, Project Management & Plant
          </p>
        </div>
        <div className="flex-1" />
        <Button onClick={() => { setValues({ section: 'Motor' }); setOpen(true); }}><Plus /> New Trial</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_TILES.map((s) => (
          <Card
            key={s.status}
            className={cn('cursor-pointer transition-colors', statusFilter === s.status && 'ring-2 ring-primary')}
            onClick={() => setStatusFilter((p) => (p === s.status ? '' : s.status))}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg grid place-items-center shrink-0', s.bg, s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none">{counts[s.status] || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search trial no, originator, project…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={sectionFilter || 'all'} onValueChange={(v) => setSectionFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Sections" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {TRIAL_SECTION.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilter || 'all'} onValueChange={(v) => setDeptFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {TRIAL_DEPT.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Trial Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trial Types</SelectItem>
            {TRIAL_TYPE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {TRIAL_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground ml-auto">
          Showing <span className="font-bold text-foreground">{filtered.length}</span> of {rows.length} trials
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trial No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Originator</TableHead>
            <TableHead>Approvals</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No trials yet</TableCell></TableRow>
          ) : filtered.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/trials/${r.id}`)}>
              <TableCell className="font-mono text-xs">{r.trialNo}</TableCell>
              <TableCell>{fmtDate(r.date)}</TableCell>
              <TableCell>{r.section}</TableCell>
              <TableCell>{r.dept}</TableCell>
              <TableCell>{r.trialType}</TableCell>
              <TableCell className="font-medium">{r.project}</TableCell>
              <TableCell>{r.originator}</TableCell>
              <TableCell>{approvals(r)} / {HOD_ROLES.length}</TableCell>
              <TableCell><Badge variant="outline" className={badgeForStatus(r.status)}>{r.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Trial Request</DialogTitle></DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
