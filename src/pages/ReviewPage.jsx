import { useEffect, useMemo, useState } from 'react';
import { Plus, CheckSquare, AlertTriangle, CalendarDays } from 'lucide-react';
import { Reviews, MomActions, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatTile from '@/components/ui/stat-tile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ACTION_ST, badgeForStatus } from '@/lib/constants';
import { cn, fmtDate, todayIso } from '@/lib/utils';

const ALL = '__all__';

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
  const [filterProj, setFilterProj] = useState(ALL);
  const [filterOwner, setFilterOwner] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);

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

  const today = todayIso();
  const openActions = actions.filter((a) => a.status !== 'Done');
  const overdueActions = openActions.filter((a) => a.due && a.due < today);
  const closedActions = actions.filter((a) => a.status === 'Done');
  const openCount = openActions.length;

  const projOptions = useMemo(() => [...new Set(actions.map((a) => a.proj).filter(Boolean))], [actions]);
  const ownerOptions = useMemo(() => [...new Set(actions.map((a) => a.owner).filter(Boolean))], [actions]);

  const filteredActions = useMemo(() => actions.filter((a) =>
    (filterProj === ALL || a.proj === filterProj) &&
    (filterOwner === ALL || a.owner === filterOwner) &&
    (filterStatus === ALL || a.status === filterStatus)
  ).sort((a, b) => (a.status === 'Done') - (b.status === 'Done') || ((a.due || '9') < (b.due || '9') ? -1 : 1)),
  [actions, filterProj, filterOwner, filterStatus]);

  // MOM Matrix — read across each project row to see what was discussed, review by review
  const matrixCols = useMemo(() => [...reviews].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8), [reviews]);
  const matrixProjects = useMemo(() => {
    const names = npds.map((n) => n.name);
    if (names.length) return names;
    const set = new Set();
    reviews.forEach((r) => Object.keys(r.notes || {}).forEach((k) => set.add(k)));
    return [...set];
  }, [npds, reviews]);

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={CheckSquare} color="#d97706" value={openActions.length} label="Open Actions" />
        <StatTile icon={AlertTriangle} color={overdueActions.length ? '#dc2626' : '#059669'} value={overdueActions.length} label="Overdue" />
        <StatTile icon={CheckSquare} color="#059669" value={closedActions.length} label="Closed" />
        <StatTile icon={CalendarDays} color="#2563eb" value={reviews.length} label="Reviews Logged" />
      </div>

      <Tabs defaultValue="actions">
        <TabsList>
          <TabsTrigger value="matrix">MOM Matrix</TabsTrigger>
          <TabsTrigger value="actions">Action Items ({openCount} open)</TabsTrigger>
          <TabsTrigger value="meetings">Meetings ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-2">
          <p className="text-xs text-muted-foreground">Read across each row to see what was discussed week by week · click any cell to open that review</p>
          {!matrixCols.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet. Click “Start Review” to begin logging.</p>
          ) : (
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card2">Project</TableHead>
                    {matrixCols.map((r) => <TableHead key={r.id} className="whitespace-nowrap">Weekly MOM · {fmtDate(r.date)}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixProjects.length === 0 ? (
                    <TableRow><TableCell colSpan={matrixCols.length + 1} className="py-10 text-center text-muted-foreground">No NPD projects yet</TableCell></TableRow>
                  ) : matrixProjects.map((p) => (
                    <TableRow key={p}>
                      <TableCell className="font-medium sticky left-0 bg-card whitespace-nowrap">{p}</TableCell>
                      {matrixCols.map((r) => {
                        const note = (r.notes && r.notes[p]) || '';
                        return (
                          <TableCell
                            key={r.id}
                            className="max-w-[240px] truncate cursor-pointer hover:bg-muted/50"
                            title={note}
                            onClick={() => openEditor(r)}
                          >
                            {note || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterProj} onValueChange={setFilterProj}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Projects</SelectItem>
                {projOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Status</SelectItem>
                {ACTION_ST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {ownerOptions.length > 0 && (
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Owners" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Owners</SelectItem>
                  {ownerOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <span className="text-xs text-muted-foreground ml-auto">Showing {filteredActions.length} of {actions.length}</span>
          </div>
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
              {filteredActions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No action items match this filter</TableCell></TableRow>
              ) : filteredActions.map((a) => {
                const isOverdue = a.status !== 'Done' && a.due && a.due < today;
                return (
                  <TableRow key={a.id} className={cn('cursor-pointer', a.status === 'Done' && 'opacity-60')} onClick={() => { setEditingAction(a); setActionVals(a); setActionDlg(true); }}>
                    <TableCell>{a.proj || '—'}</TableCell>
                    <TableCell className="max-w-md">{a.text}</TableCell>
                    <TableCell>{a.owner || '—'}</TableCell>
                    <TableCell>{fmtDate(a.raisedOn)}</TableCell>
                    <TableCell className={cn(isOverdue && 'text-red-600 font-semibold')}>{fmtDate(a.due)}{isOverdue ? ' ⚠' : ''}</TableCell>
                    <TableCell><Badge variant="outline" className={badgeForStatus(a.status)}>{a.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-3">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet — start one.</p>}
          {[...reviews].reverse().map((r) => (
            <Card key={r.id} className="cursor-pointer hover:border-primary/40" onClick={() => openEditor(r)}>
              <CardHeader>
                <CardTitle className="text-sm">Review — {fmtDate(r.date)}</CardTitle>
                <span className="text-xs text-muted-foreground shrink-0">{Object.keys(r.notes || {}).length} project notes</span>
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
