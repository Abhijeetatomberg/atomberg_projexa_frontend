import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MomActions, Reviews } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { ACTION_ST, badgeForStatus } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';

export default function ReviewsTab({ project }) {
  const [actions, setActions] = useState([]);
  const [history, setHistory] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [vals, setVals] = useState({});

  const load = () => {
    MomActions.list().then((all) => setActions(all.filter((a) => a.proj === project.name))).catch((e) => toast(e.message, 'error'));
    Reviews.list().then((all) => setHistory(
      all.filter((r) => r.notes?.[project.name]).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    )).catch(() => {});
  };
  useEffect(() => { load(); }, [project.name]);

  const addAction = async () => {
    if (!vals.text?.trim()) { toast('Action text required', 'error'); return; }
    try {
      await MomActions.create({ ...vals, proj: project.name, status: vals.status || 'Open' });
      toast('Action added', 'success');
      setAddOpen(false);
      setVals({});
      load();
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const toggleDone = async (a) => {
    try {
      await MomActions.update(a.id, { status: a.status === 'Done' ? 'Open' : 'Done' });
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Action items raised for this project across Weekly Reviews.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/reviews">Open Weekly Review</Link></Button>
          <Button size="sm" onClick={() => { setVals({}); setAddOpen(true); }}><Plus /> Add Action</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Action</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No action items for this project.</TableCell></TableRow>
          ) : actions.map((a) => (
            <TableRow key={a.id} className={a.status === 'Done' ? 'opacity-60' : undefined}>
              <TableCell>
                <input type="checkbox" checked={a.status === 'Done'} onChange={() => toggleDone(a)} className="h-4 w-4 cursor-pointer" />
              </TableCell>
              <TableCell className={a.status === 'Done' ? 'line-through' : ''}>{a.text}</TableCell>
              <TableCell>{a.owner || '—'}</TableCell>
              <TableCell>{fmtDate(a.due)}</TableCell>
              <TableCell><Badge variant="outline" className={badgeForStatus(a.status)}>{a.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div>
        <div className="text-sm font-semibold mb-2">Review Remarks History</div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No review remarks logged yet for this project.</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3">
                  <div className="text-xs font-semibold text-primary mb-1">{fmtDate(r.date)}</div>
                  <div className="text-sm whitespace-pre-wrap">{r.notes[project.name]}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Action — {project.name}</DialogTitle></DialogHeader>
          <FormFields
            fields={[
              { key: 'text', label: 'Action', span: 2 },
              { key: 'owner', label: 'Owner' },
              { key: 'due', label: 'Due Date', type: 'date' },
              { key: 'status', label: 'Status', type: 'select', options: ACTION_ST },
            ]}
            values={vals}
            onChange={setVals}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addAction}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
