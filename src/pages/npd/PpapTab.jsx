import { useEffect, useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PpapDocs } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { PPAP_ELEMENTS, PPAP_STATUS, badgeForStatus } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';

export default function PpapTab({ project }) {
  const [docs, setDocs] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [vals, setVals] = useState({});

  const load = () => PpapDocs.list().then((all) => setDocs(all.filter((d) => d.proj === project.name))).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [project.name]);

  const approved = docs.filter((d) => d.status === 'Approved').length;

  const generateSet = async () => {
    const existing = docs.map((d) => d.element);
    const toAdd = PPAP_ELEMENTS.filter((el) => !existing.includes(el));
    if (!toAdd.length) { toast('All 18 elements already exist for this project'); return; }
    try {
      await Promise.all(toAdd.map((el) => PpapDocs.create({ proj: project.name, element: el, status: 'Not Started' })));
      toast(`${toAdd.length} PPAP elements created`, 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const addDoc = async () => {
    if (!vals.element?.trim()) { toast('Document / Element required', 'error'); return; }
    try {
      await PpapDocs.create({ ...vals, proj: project.name, status: vals.status || 'Not Started' });
      toast('Document added', 'success');
      setAddOpen(false);
      setVals({});
      load();
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-3">
      {docs.length > 0 && (
        <div className="flex items-center gap-3">
          <Progress value={docs.length ? (approved / docs.length) * 100 : 0} className="max-w-xs" />
          <span className="text-xs text-muted-foreground">{approved} / {docs.length} elements approved</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Same data as the PPAP Docs module — anything added here shows up there too.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/ppap">Open full PPAP Docs</Link></Button>
          <Button variant="outline" size="sm" onClick={generateSet}><Layers /> Generate 18-Element Set</Button>
          <Button size="sm" onClick={() => { setVals({}); setAddOpen(true); }}><Plus /> Add Document</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document / Element</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Approved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No PPAP documents for this project yet. Use "Generate 18-Element Set" for the standard AIAG checklist.</TableCell></TableRow>
          ) : docs.map((d) => (
            <TableRow key={d.id}>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add PPAP Document — {project.name}</DialogTitle></DialogHeader>
          <FormFields
            fields={[
              { key: 'element', label: 'Document / Element', type: 'select', options: PPAP_ELEMENTS, span: 2 },
              { key: 'status', label: 'Status', type: 'select', options: PPAP_STATUS },
              { key: 'owner', label: 'Owner' },
              { key: 'due', label: 'Due Date', type: 'date' },
            ]}
            values={vals}
            onChange={setVals}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addDoc}>Add Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
