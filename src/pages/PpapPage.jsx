import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Paperclip, Download, X, Loader2, Search, FileBox, CheckCircle2, Clock, CircleDashed, FileDown, Trash2, Layers,
} from 'lucide-react';
import { PpapDocs, Npds, uploadAttachment, attachmentUrl, deleteAttachment } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn, fmtDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const ALL = '__all__';
const ALL_PROJECTS = '__all_projects__';

const PPAP_SORTS = [
  { k: 'due', label: 'Due Date (Soonest)', fn: (a, b) => (a.due || '').localeCompare(b.due || '') },
  { k: 'status', label: 'Status', fn: (a, b) => (a.status || '').localeCompare(b.status || '') },
  { k: 'name', label: 'Document Name (A-Z)', fn: (a, b) => (a.element || '').localeCompare(b.element || '') },
  { k: 'owner', label: 'Owner (A-Z)', fn: (a, b) => (a.owner || '').localeCompare(b.owner || '') },
];

function exportPpapCsv(docs) {
  if (!docs.length) { toast('No PPAP documents to export', 'error'); return; }
  const headers = ['Project', 'Document / Element', 'Status', 'Owner', 'Due Date', 'Submitted', 'Approved'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [headers.join(',')].concat(
    docs.map((p) => [p.proj, p.element, p.status, p.owner, p.due, p.submitted, p.approved].map(esc).join(','))
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ppap-documents-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Exported ${docs.length} documents`, 'success');
}

const FULL_EDIT_FIELDS = [
  { key: 'status', label: 'Status', type: 'select', options: PPAP_STATUS },
  { key: 'owner', label: 'Owner' },
  { key: 'due', label: 'Due Date', type: 'date' },
  { key: 'submitted', label: 'Submitted On', type: 'date' },
  { key: 'approved', label: 'Approved On', type: 'date' },
];
// The assigned owner (non-admin) may only update these two dates — everything
// else (status/owner/due) is admin-only, mirroring the legacy `canEditField` rule.
const RESTRICTED_EDIT_FIELDS = [
  { key: 'submitted', label: 'Submitted On', type: 'date' },
  { key: 'approved', label: 'Approved On', type: 'date' },
];

export default function PpapPage() {
  const { user, isAdmin } = useAuth();
  const [docs, setDocs] = useState([]);
  const [npds, setNpds] = useState([]);
  const [proj, setProj] = useState(ALL_PROJECTS);
  const [q, setQ] = useState('');
  const [statFilter, setStatFilter] = useState(ALL);
  const [sort, setSort] = useState('due');
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupVals, setSetupVals] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [addVals, setAddVals] = useState({});
  const [addFile, setAddFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const addFileRef = useRef(null);

  const load = () => {
    PpapDocs.list().then(setDocs).catch((e) => toast(e.message, 'error'));
    Npds.list().then(setNpds).catch(() => {});
  };
  useEffect(load, []);

  const projects = useMemo(() => [...new Set(docs.map((d) => d.proj).filter(Boolean))], [docs]);
  // "All Projects" still shows a scoped stats/progress card for the first project (mirrors legacy's prim=ppapProj||projs[0])
  const active = (proj !== ALL_PROJECTS && proj) || projects[0] || '';
  const primSet = docs.filter((d) => d.proj === active);
  const approved = primSet.filter((d) => d.status === 'Approved').length;
  const submitted = primSet.filter((d) => d.status === 'Submitted').length;
  const notStarted = primSet.filter((d) => d.status === 'Not Started').length;

  const list = useMemo(() => docs
    .filter((d) => (proj === ALL_PROJECTS || d.proj === proj) &&
      (statFilter === ALL || d.status === statFilter) &&
      (!q || `${d.element} ${d.proj}`.toLowerCase().includes(q.toLowerCase())))
    .sort((PPAP_SORTS.find((s) => s.k === sort) || PPAP_SORTS[0]).fn),
  [docs, proj, statFilter, q, sort]);
  const showProjCol = proj === ALL_PROJECTS;

  const remove = async (d) => {
    if (!confirm(`Remove "${d.element}"?`)) return;
    try {
      await PpapDocs.remove(d.id);
      setDocs((p) => p.filter((x) => x.id !== d.id));
      toast('Document removed', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

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

  // Adds a single, one-off PPAP document (as opposed to the full 18-element set)
  const addDocument = async () => {
    const p = addVals.proj?.trim();
    const el = addVals.element?.trim();
    if (!p || !el) { toast('Project and Document / Element are required', 'error'); return; }
    try {
      let doc = await PpapDocs.create({
        proj: p, element: el, status: addVals.status || 'Not Started',
        owner: addVals.owner || '', due: addVals.due || '', submitted: '', approved: '', files: [],
      });
      if (addFile) {
        try {
          const meta = await uploadAttachment(addFile, { module: 'ppap', refId: doc.id, uploadedBy: user?.name });
          doc = await PpapDocs.update(doc.id, { files: [meta] });
        } catch (err) {
          toast(err.response?.data?.error || 'Attachment upload failed — document saved without it', 'error');
        }
      }
      setDocs((prev) => [...prev, doc]);
      toast('Document added', 'success');
      setAddOpen(false);
      setProj(p);
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

  // Attach a file: upload the bytes to S3 via the backend, then append the
  // returned pointer to this document's `files` column.
  const attachFile = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !editing) return;
    setUploading(true);
    try {
      const meta = await uploadAttachment(file, {
        module: 'ppap',
        refId: editing.id,
        uploadedBy: user?.name,
      });
      const files = [...(values.files || []), meta];
      const u = await PpapDocs.update(editing.id, { files });
      setDocs((p) => p.map((d) => (d.id === u.id ? u : d)));
      setValues(u);
      setEditing(u);
      toast('File attached', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Removes both the S3 object (+ pointer row) and the entry in `files`.
  const removeFile = async (fileId) => {
    if (!editing) return;
    try {
      await deleteAttachment(fileId);
      const files = (values.files || []).filter((f) => f.id !== fileId);
      const u = await PpapDocs.update(editing.id, { files });
      setDocs((p) => p.map((d) => (d.id === u.id ? u : d)));
      setValues(u);
      setEditing(u);
      toast('File removed', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">PPAP Docs</h1>
          <p className="text-sm text-muted-foreground">Production Part Approval Process — 18 Element Tracking</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => exportPpapCsv(docs)}><FileDown /> Export</Button>
        <Button variant="outline" onClick={() => { setSetupVals({}); setSetupOpen(true); }}><Layers /> Generate 18-Element Set</Button>
        <Button onClick={() => { setAddVals({ proj: active }); setAddFile(null); setAddOpen(true); }}><Plus /> Add Document</Button>
      </div>

      {active && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-amber-100 text-amber-600"><FileBox className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{primSet.length}</div><div className="text-xs text-muted-foreground mt-1">Total Documents</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{approved}</div><div className="text-xs text-muted-foreground mt-1">Approved</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-amber-100 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{submitted}</div><div className="text-xs text-muted-foreground mt-1">Submitted</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-slate-100 text-slate-500"><CircleDashed className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{notStarted}</div><div className="text-xs text-muted-foreground mt-1">Not Started</div></div>
              </CardContent>
            </Card>
          </div>

          {projects.length > 1 && (
            <div className="grid md:grid-cols-3 gap-3">
              {projects.slice(0, 3).map((pr) => {
                const set = docs.filter((d) => d.proj === pr);
                const ap = set.filter((d) => d.status === 'Approved').length;
                const rev = set.filter((d) => d.status === 'Submitted' || d.status === 'Interim Approval').length;
                return (
                  <Card key={pr} className={cn('cursor-pointer', pr === active && 'ring-2 ring-primary')} onClick={() => setProj(pr)}>
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold truncate">{pr}</div>
                      <div className="flex justify-between text-xs mt-2 mb-1">
                        <span className="text-muted-foreground">Elements Approved</span>
                        <b>{ap}/{set.length}</b>
                      </div>
                      <Progress value={set.length ? (ap / set.length) * 100 : 0} />
                      <div className="flex gap-1.5 mt-2.5">
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">{ap} Approved</Badge>
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{rev} Review</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{active}</span>
                <span className="text-muted-foreground font-normal">{approved} / {primSet.length} approved</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={primSet.length ? (approved / primSet.length) * 100 : 0} />
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={proj} onValueChange={setProj}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROJECTS}>All Projects</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statFilter} onValueChange={setStatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Status</SelectItem>
            {PPAP_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PPAP_SORTS.map((s) => <SelectItem key={s.k} value={s.k}>Sort: {s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Element</TableHead>
            {showProjCol && <TableHead>Project</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Approved</TableHead>
            <TableHead>Files</TableHead>
            {isAdmin && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={(showProjCol ? 9 : 8) + (isAdmin ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                No PPAP documents yet. Use “Generate 18-Element Set” to create the standard checklist for a project, or “Add Document” for a single one.
              </TableCell>
            </TableRow>
          ) : list.map((d, i) => (
            <TableRow key={d.id} className="cursor-pointer" onClick={() => { setEditing(d); setValues(d); }}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{d.element}</TableCell>
              {showProjCol && <TableCell className="text-muted-foreground">{d.proj}</TableCell>}
              <TableCell><Badge variant="outline" className={badgeForStatus(d.status)}>{d.status}</Badge></TableCell>
              <TableCell>{d.owner || '—'}</TableCell>
              <TableCell>{fmtDate(d.due)}</TableCell>
              <TableCell>{fmtDate(d.submitted)}</TableCell>
              <TableCell>{fmtDate(d.approved)}</TableCell>
              <TableCell className="text-muted-foreground">
                {(d.files || []).length ? `${d.files.length} file${d.files.length > 1 ? 's' : ''}` : '—'}
              </TableCell>
              {isAdmin && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => remove(d)} title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Standard 18-Element Set</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Creates all 18 standard AIAG PPAP elements for the chosen project in one go, each starting as
            {' '}<b>Not Started</b>. You can edit or delete any of them afterwards.
          </p>
          <FormFields
            fields={[
              {
                key: 'proj', label: 'Project', type: npds.length ? 'select' : 'text',
                options: npds.map((n) => n.name), span: 2,
              },
              { key: 'owner', label: 'Owner (applied to all 18 — optional)' },
              { key: 'due', label: 'Target Due Date (applied to all 18 — optional)', type: 'date' },
            ]}
            values={setupVals}
            onChange={setSetupVals}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button onClick={setupProject}>Generate 18 Elements</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.element}</DialogTitle></DialogHeader>
          {(() => {
            const canFull = isAdmin;
            const canRestricted = canFull || (user?.name && user.name === editing?.owner);
            return (
              <>
                {!canFull && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    {canRestricted
                      ? 'You can update Submitted Date and Approved Date here — everything else is set by an admin.'
                      : 'View only — only the assigned owner or an admin can update this document.'}
                  </p>
                )}
                {!canFull && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><div className="text-muted-foreground text-xs">Project</div>{editing?.proj}</div>
                    <div><div className="text-muted-foreground text-xs">Status</div>{editing?.status}</div>
                    <div><div className="text-muted-foreground text-xs">Owner</div>{editing?.owner || '—'}</div>
                    <div><div className="text-muted-foreground text-xs">Due Date</div>{fmtDate(editing?.due)}</div>
                  </div>
                )}
                <FormFields
                  fields={canFull ? FULL_EDIT_FIELDS : canRestricted ? RESTRICTED_EDIT_FIELDS : []}
                  values={values}
                  onChange={setValues}
                />
              </>
            );
          })()}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Documents</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={attachFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                {uploading ? 'Uploading…' : 'Attach'}
              </Button>
            </div>
            {(values.files || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents attached yet.</p>
            ) : (
              <ul className="space-y-1">
                {values.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm"
                  >
                    <a
                      href={attachmentUrl(f.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 truncate text-primary hover:underline"
                      title={f.name}
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </a>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(f.id)}
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            {(isAdmin || (user?.name && user.name === editing?.owner)) && <Button onClick={save}>Save</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add PPAP Document</DialogTitle></DialogHeader>
          <FormFields
            fields={[
              {
                key: 'proj', label: 'Project', type: npds.length ? 'select' : 'text',
                options: npds.map((n) => n.name), span: 2,
              },
              {
                key: 'element', label: 'Document / Element', type: 'select', span: 2,
                options: PPAP_ELEMENTS,
              },
              { key: 'status', label: 'Status', type: 'select', options: PPAP_STATUS },
              { key: 'owner', label: 'Owner' },
              { key: 'due', label: 'Due Date', type: 'date' },
            ]}
            values={addVals}
            onChange={setAddVals}
          />
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Attachment (optional)</span>
            <input ref={addFileRef} type="file" className="hidden" onChange={(e) => setAddFile(e.target.files?.[0] || null)} />
            <Button type="button" variant="outline" size="sm" onClick={() => addFileRef.current?.click()}>
              <Paperclip /> {addFile ? addFile.name : 'Choose file'}
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addDocument}>Add Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
