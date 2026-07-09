import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PpapDocs, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { toast } from '@/components/toaster';
import { PPAP_ELEMENTS, PPAP_STATUS, badgeForStatus } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';

const editFields = [
  { key: 'status', label: 'Status', type: 'select', options: PPAP_STATUS },
  { key: 'owner', label: 'Owner' },
  { key: 'due', label: 'Due Date', type: 'date' },
  { key: 'submitted', label: 'Submitted On', type: 'date' },
  { key: 'approved', label: 'Approved On', type: 'date' },
];

export default function PpapPage() {
  const [docs, setDocs] = useState([]);
  const [npds, setNpds] = useState([]);
  const [proj, setProj] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupVals, setSetupVals] = useState({});
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});

  const load = () => {
    PpapDocs.list().then(setDocs).catch((e) => toast(e.message, 'error'));
    Npds.list().then(setNpds).catch(() => {});
  };
  useEffect(load, []);

  const projects = useMemo(() => [...new Set(docs.map((d) => d.proj).filter(Boolean))], [docs]);
  const active = proj || projects[0] || '';
  const list = docs.filter((d) => d.proj === active);
  const approved = list.filter((d) => d.status === 'Approved').length;

  // Creates the standard 18-element checklist for a project in one shot
  const setupProject = async () => {
    const p = setupVals.proj?.trim();
    if (!p) { toast('Pick a project', 'error'); return; }
    const existing = docs.filter((d) => d.proj === p).map((d) => d.element);
    const toAdd = PPAP_ELEMENTS.filter((el) => !existing.includes(el));
    if (!toAdd.length) { toast('All 18 elements already exist for this project'); return; }
    try {
      await Promise.all(toAdd.map((el) =>
        PpapDocs.create({ proj: p, element: el, status: 'Not Started', owner: setupVals.owner || '', due: setupVals.due || '' })
      ));
      toast(`${toAdd.length} PPAP elements created for ${p}`, 'success');
      setSetupOpen(false);
      setProj(p);
      load();
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const save = async () => {
    try {
      const u = await PpapDocs.update(editing.id, values);
      setDocs((p) => p.map((d) => (d.id === u.id ? u : d)));
      setEditing(null);
      toast('Updated', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">PPAP Docs</h1>
          <p className="text-sm text-muted-foreground">18-element PPAP checklist per project</p>
        </div>
        <div className="flex-1" />
        {projects.length > 0 && (
          <Select value={active} onValueChange={setProj}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => { setSetupVals({}); setSetupOpen(true); }}><Plus /> Setup Project</Button>
      </div>

      {active && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>{active}</span>
              <span className="text-muted-foreground font-normal">{approved} / {list.length} approved</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={list.length ? (approved / list.length) * 100 : 0} />
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Element</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Approved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                No PPAP checklist yet — use “Setup Project” to create the 18 elements.
              </TableCell>
            </TableRow>
          ) : list.map((d, i) => (
            <TableRow key={d.id} className="cursor-pointer" onClick={() => { setEditing(d); setValues(d); }}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{d.element}</TableCell>
              <TableCell><Badge variant="outline" className={badgeForStatus(d.status)}>{d.status}</Badge></TableCell>
              <TableCell>{d.owner || '—'}</TableCell>
              <TableCell>{fmtDate(d.due)}</TableCell>
              <TableCell>{fmtDate(d.submitted)}</TableCell>
              <TableCell>{fmtDate(d.approved)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Setup PPAP for a project</DialogTitle></DialogHeader>
          <FormFields
            fields={[
              {
                key: 'proj', label: 'Project', type: npds.length ? 'select' : 'text',
                options: npds.map((n) => n.name), span: 2,
              },
              { key: 'owner', label: 'Default Owner' },
              { key: 'due', label: 'Default Due Date', type: 'date' },
            ]}
            values={setupVals}
            onChange={setSetupVals}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button onClick={setupProject}>Create 18 Elements</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.element}</DialogTitle></DialogHeader>
          <FormFields fields={editFields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
