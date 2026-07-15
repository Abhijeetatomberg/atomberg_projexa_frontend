import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Search, FileText, CheckCircle2, Paperclip, Download, X, Loader2, Trash2,
} from 'lucide-react';
import { StdDocs, uploadAttachment, attachmentUrl, deleteAttachment } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { STD_CAT, badgeForStatus } from '@/lib/constants';
import { fmtDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const STD_STATUS = ['Active', 'Under Revision', 'Obsolete'];

const fields = [
  { key: 'title', label: 'Document Title', span: 2, placeholder: 'e.g. Project Management Procedure' },
  { key: 'docNo', label: 'Document No.', placeholder: 'e.g. AIPL/PM/PR/01' },
  { key: 'category', label: 'Category', type: 'select', options: STD_CAT },
  { key: 'owner', label: 'Owner' },
  { key: 'effDate', label: 'Effective Date', type: 'date' },
  { key: 'rev', label: 'Revision', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STD_STATUS },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function StandardsPage() {
  const { isAdmin, user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // File objects picked before the doc exists
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    StdDocs.list().then(setDocs).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => docs.filter((d) =>
    (!catFilter || d.category === catFilter) &&
    (!q || `${d.title} ${d.docNo} ${d.category} ${d.owner}`.toLowerCase().includes(q.toLowerCase()))
  ), [docs, catFilter, q]);

  const catCounts = useMemo(() => {
    const c = {};
    docs.forEach((d) => { c[d.category] = (c[d.category] || 0) + 1; });
    return c;
  }, [docs]);

  const openCreate = () => {
    setEditing(null);
    setValues({ category: 'Procedure (SOP)', rev: 1, status: 'Active' });
    setPendingFiles([]);
    setOpen(true);
  };
  const openEdit = (d) => { setEditing(d); setValues(d); setPendingFiles([]); setOpen(true); };

  const save = async () => {
    if (!values.title?.trim()) { toast('Document title is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        const u = await StdDocs.update(editing.id, values);
        setDocs((p) => p.map((d) => (d.id === u.id ? u : d)));
        toast('Document updated', 'success');
        setOpen(false);
      } else {
        let created = await StdDocs.create({
          ...values,
          rev: values.rev || 1,
          status: values.status || 'Active',
          files: [],
        });
        if (pendingFiles.length) {
          const metas = [];
          for (const f of pendingFiles) {
            // eslint-disable-next-line no-await-in-loop
            const meta = await uploadAttachment(f, { module: 'standards', refId: created.id, uploadedBy: user?.name });
            metas.push(meta);
          }
          created = await StdDocs.update(created.id, { files: metas });
        }
        setDocs((p) => [...p, created]);
        toast('Document added', 'success');
        setOpen(false);
      }
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing || !confirm(`Remove "${editing.title}" from the library?`)) return;
    try {
      await StdDocs.remove(editing.id);
      setDocs((p) => p.filter((d) => d.id !== editing.id));
      setOpen(false);
      toast('Document removed', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const pickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!list.length) return;
    if (editing) attachExisting(list[0]);
    else setPendingFiles((p) => [...p, ...list]);
  };

  // Attach directly to an already-saved document (uploads immediately).
  const attachExisting = async (file) => {
    if (!editing) return;
    setUploading(true);
    try {
      const meta = await uploadAttachment(file, { module: 'standards', refId: editing.id, uploadedBy: user?.name });
      const files = [...(values.files || []), meta];
      const u = await StdDocs.update(editing.id, { files });
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

  const removeExistingFile = async (fileId) => {
    if (!editing) return;
    try {
      await deleteAttachment(fileId);
      const files = (values.files || []).filter((f) => f.id !== fileId);
      const u = await StdDocs.update(editing.id, { files });
      setDocs((p) => p.map((d) => (d.id === u.id ? u : d)));
      setValues(u);
      setEditing(u);
      toast('File removed', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    }
  };

  const removePendingFile = (idx) => setPendingFiles((p) => p.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Standards Library</h1>
          <p className="text-sm text-muted-foreground">
            Controlled project-management documents — policies, procedures, work instructions &amp; formats
          </p>
        </div>
        <div className="flex-1" />
        {isAdmin && <Button onClick={openCreate}><Plus /> Add Document</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-slate-100 text-slate-700"><FileText className="h-5 w-5" /></div>
          <div><div className="text-2xl font-bold leading-none">{docs.length}</div><div className="text-xs text-muted-foreground mt-1">Documents</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
          <div><div className="text-2xl font-bold leading-none">{docs.filter((d) => d.status === 'Active').length}</div><div className="text-xs text-muted-foreground mt-1">Active</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-violet-100 text-violet-600"><Paperclip className="h-5 w-5" /></div>
          <div><div className="text-2xl font-bold leading-none">{docs.filter((d) => (d.files || []).length).length}</div><div className="text-xs text-muted-foreground mt-1">With Attachment</div></div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCatFilter('')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs whitespace-nowrap',
            catFilter === '' ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground'
          )}
        >
          All {docs.length}
        </button>
        {STD_CAT.filter((c) => catCounts[c]).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCatFilter(catFilter === c ? '' : c)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs whitespace-nowrap',
              catFilter === c ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground'
            )}
          >
            {c} {catCounts[c]}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search title, doc no, owner…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rev</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attachment</TableHead>
              {isAdmin && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                {docs.length === 0 ? 'No documents yet.' : 'No documents match this filter.'}
              </TableCell></TableRow>
            ) : filtered.map((d) => (
              <TableRow
                key={d.id}
                className={cn(isAdmin && 'cursor-pointer')}
                onClick={() => isAdmin && openEdit(d)}
              >
                <TableCell className="font-mono text-xs">{d.docNo || '—'}</TableCell>
                <TableCell>
                  <div className="font-medium">{d.title}</div>
                  {d.remarks && <div className="text-xs text-muted-foreground">{d.remarks}</div>}
                </TableCell>
                <TableCell><Badge variant="secondary">{d.category}</Badge></TableCell>
                <TableCell>Rev {d.rev ?? 1}</TableCell>
                <TableCell>{d.owner || '—'}</TableCell>
                <TableCell>{fmtDate(d.effDate)}</TableCell>
                <TableCell><Badge variant="outline" className={badgeForStatus(d.status)}>{d.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  {(d.files || []).length ? `${d.files.length} file${d.files.length > 1 ? 's' : ''}` : '—'}
                </TableCell>
                {isAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Remove"
                      onClick={async () => {
                        if (!confirm(`Remove "${d.title}" from the library?`)) return;
                        try {
                          await StdDocs.remove(d.id);
                          setDocs((p) => p.filter((x) => x.id !== d.id));
                          toast('Document removed', 'success');
                        } catch (e) {
                          toast(e.response?.data?.error || e.message, 'error');
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit document' : 'Add document'}</DialogTitle>
          </DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Attachment</span>
              <input ref={fileInputRef} type="file" className="hidden" onChange={pickFiles} />
              <Button
                type="button" variant="outline" size="sm" disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                {uploading ? 'Uploading…' : 'Attach'}
              </Button>
            </div>

            {editing ? (
              (values.files || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No file attached yet.</p>
              ) : (
                <ul className="space-y-1">
                  {values.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm">
                      <a
                        href={attachmentUrl(f.id)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 truncate text-primary hover:underline" title={f.name}
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </a>
                      <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => removeExistingFile(f.id)} title="Remove">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              pendingFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No file selected yet — this creates Rev 1.</p>
              ) : (
                <ul className="space-y-1">
                  {pendingFiles.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm">
                      <span className="flex items-center gap-1.5 truncate" title={f.name}>
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{f.name}</span>
                      </span>
                      <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => removePendingFile(i)} title="Remove">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>

          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" className="mr-auto" onClick={remove}><Trash2 /> Delete</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : (editing ? 'Save' : 'Add document')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
