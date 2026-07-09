import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Trials } from '@/api/resources';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { TRIAL_SECTION, TRIAL_DEPT, TRIAL_TYPE, HOD_ROLES, badgeForStatus } from '@/lib/constants';
import { fmtDate, todayIso } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    Trials.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => !q || `${r.trialNo} ${r.project} ${r.originator} ${r.dept}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

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
          <p className="text-sm text-muted-foreground">Trial request forms with HOD approvals & closure</p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search trials…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={() => { setValues({ section: 'Motor' }); setOpen(true); }}><Plus /> New Trial</Button>
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
