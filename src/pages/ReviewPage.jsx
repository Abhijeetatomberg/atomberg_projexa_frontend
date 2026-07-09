import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Reviews, MomActions, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { ACTION_ST, badgeForStatus } from '@/lib/constants';
import { fmtDate, todayIso } from '@/lib/utils';

const actionFields = [
  { key: 'proj', label: 'Project' },
  { key: 'owner', label: 'Owner' },
  { key: 'text', label: 'Action Item', type: 'textarea' },
  { key: 'due', label: 'Due Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ACTION_ST },
];

export default function ReviewPage() {
  const [reviews, setReviews] = useState([]);
  const [actions, setActions] = useState([]);
  const [npds, setNpds] = useState([]);
  const [openReview, setOpenReview] = useState(null); // review being edited
  const [notes, setNotes] = useState({});
  const [attendees, setAttendees] = useState('');
  const [actionDlg, setActionDlg] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [actionVals, setActionVals] = useState({});

  const load = () => {
    Reviews.list().then(setReviews).catch((e) => toast(e.message, 'error'));
    MomActions.list().then(setActions).catch(() => {});
    Npds.list().then(setNpds).catch(() => {});
  };
  useEffect(load, []);

  const startReview = async () => {
    const last = reviews[reviews.length - 1];
    try {
      const r = await Reviews.create({ date: todayIso(), attendees: last?.attendees || '', notes: {} });
      setReviews((p) => [...p, r]);
      openEditor(r);
      toast('Review started', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const openEditor = (r) => {
    setOpenReview(r);
    setNotes(r.notes || {});
    setAttendees(r.attendees || '');
  };

  const saveReview = async () => {
    try {
      const u = await Reviews.update(openReview.id, { notes, attendees });
      setReviews((p) => p.map((r) => (r.id === u.id ? u : r)));
      setOpenReview(null);
      toast('Review saved', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const saveAction = async () => {
    try {
      if (editingAction) {
        const u = await MomActions.update(editingAction.id, actionVals);
        setActions((p) => p.map((a) => (a.id === u.id ? u : a)));
      } else {
        const c = await MomActions.create({
          ...actionVals,
          raisedOn: todayIso(),
          reviewId: openReview?.id ?? null,
        });
        setActions((p) => [...p, c]);
      }
      setActionDlg(false);
      toast('Action saved', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const openCount = actions.filter((a) => a.status !== 'Done').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Weekly Review</h1>
          <p className="text-sm text-muted-foreground">Meeting notes per project & MOM action items</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => { setEditingAction(null); setActionVals({ status: 'Open' }); setActionDlg(true); }}>
          <Plus /> Action Item
        </Button>
        <Button onClick={startReview}><Plus /> Start Review</Button>
      </div>

      <Tabs defaultValue="actions">
        <TabsList>
          <TabsTrigger value="actions">Action Items ({openCount} open)</TabsTrigger>
          <TabsTrigger value="meetings">Meetings ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Raised</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No action items yet</TableCell></TableRow>
              ) : actions.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => { setEditingAction(a); setActionVals(a); setActionDlg(true); }}>
                  <TableCell>{a.proj || '—'}</TableCell>
                  <TableCell className="max-w-md">{a.text}</TableCell>
                  <TableCell>{a.owner || '—'}</TableCell>
                  <TableCell>{fmtDate(a.raisedOn)}</TableCell>
                  <TableCell>{fmtDate(a.due)}</TableCell>
                  <TableCell><Badge variant="outline" className={badgeForStatus(a.status)}>{a.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-3">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet — start one.</p>}
          {[...reviews].reverse().map((r) => (
            <Card key={r.id} className="cursor-pointer hover:border-primary/40" onClick={() => openEditor(r)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex justify-between">
                  <span>Review — {fmtDate(r.date)}</span>
                  <span className="font-normal text-muted-foreground">{Object.keys(r.notes || {}).length} project notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground truncate">
                {r.attendees ? `Attendees: ${r.attendees}` : 'No attendees recorded'}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Review editor */}
      <Dialog open={!!openReview} onOpenChange={(o) => !o && setOpenReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review — {openReview && fmtDate(openReview.date)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Attendees</label>
              <Textarea rows={2} value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Who was present…" />
            </div>
            {(npds.length ? npds.map((n) => n.name) : Object.keys(notes)).map((p) => (
              <div key={p}>
                <label className="text-xs font-semibold text-muted-foreground">{p}</label>
                <Textarea
                  rows={2}
                  value={notes[p] || ''}
                  placeholder="Notes for this project…"
                  onChange={(e) => setNotes({ ...notes, [p]: e.target.value })}
                />
              </div>
            ))}
            {!npds.length && !Object.keys(notes).length && (
              <p className="text-sm text-muted-foreground">No NPD projects yet — notes are grouped per project.</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenReview(null)}>Close</Button>
            <Button onClick={saveReview}>Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action editor */}
      <Dialog open={actionDlg} onOpenChange={setActionDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAction ? 'Edit Action' : 'New Action Item'}</DialogTitle></DialogHeader>
          <FormFields fields={actionFields} values={actionVals} onChange={setActionVals} />
          <DialogFooter className="gap-2">
            {editingAction && (
              <Button
                variant="destructive"
                className="mr-auto"
                onClick={async () => {
                  if (!confirm('Delete this action?')) return;
                  await MomActions.remove(editingAction.id);
                  setActions((p) => p.filter((a) => a.id !== editingAction.id));
                  setActionDlg(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setActionDlg(false)}>Cancel</Button>
            <Button onClick={saveAction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
