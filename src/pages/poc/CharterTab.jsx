import { useRef, useState } from 'react';
import { Plus, X, Download, Trash2 } from 'lucide-react';
import { uploadAttachment, attachmentUrl, deleteAttachment } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/toaster';
import { useAuth } from '@/context/AuthContext';

const TEAM_ROLES = [
  ['pm', 'Project Lead / PM'],
  ['mech', 'Mechanical Lead'],
  ['elec', 'Electrical Lead'],
  ['sourcing', 'Sourcing'],
  ['bd', 'BD / Application Engineer'],
];

function FileBucket({ files, onAdd, onRemove, label }) {
  const inputRef = useRef(null);
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const attach = async (e) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const meta = await uploadAttachment(file, { module: 'poc-charter', uploadedBy: user?.name });
      onAdd(meta);
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {(files || []).map((f) => (
          <span key={f.id} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs">
            <a href={attachmentUrl(f.id)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline" title={f.name}>
              <Download className="h-3 w-3" /> <span className="max-w-[140px] truncate">{f.name}</span>
            </a>
            <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(f.id)}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <input ref={inputRef} type="file" className="hidden" onChange={attach} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Plus className="h-3.5 w-3.5" /> {busy ? 'Uploading…' : `Attach ${label}`}
      </Button>
    </div>
  );
}

export default function CharterTab({ project, onSave }) {
  const charter = project.charter || {};
  const files = charter.files || { problem: [], specs: [], business: [] };
  const extraTeam = charter.extraTeam || [];

  const set = (key, val) => onSave({ ...charter, [key]: val });
  const setFiles = (bucket, next) => onSave({ ...charter, files: { ...files, [bucket]: next } });
  const addFile = (bucket, meta) => setFiles(bucket, [...(files[bucket] || []), meta]);
  const removeFile = async (bucket, fileId) => {
    try {
      await deleteAttachment(fileId);
      setFiles(bucket, (files[bucket] || []).filter((f) => f.id !== fileId));
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    }
  };

  const setExtra = (i, field, val) => {
    const next = extraTeam.map((m, ix) => (ix === i ? { ...m, [field]: val } : m));
    onSave({ ...charter, extraTeam: next });
  };
  const addExtra = () => onSave({ ...charter, extraTeam: [...extraTeam, { role: '', person: '' }] });
  const removeExtra = (i) => onSave({ ...charter, extraTeam: extraTeam.filter((_, ix) => ix !== i) });

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">POC Charter</CardTitle></CardHeader>
      <CardContent className="space-y-4 max-w-3xl">
        <div>
          <Label>Problem Statement / Opportunity</Label>
          <Textarea className="mt-1" value={charter.problem || ''} onChange={(e) => set('problem', e.target.value)} />
          <div className="mt-1.5"><FileBucket files={files.problem} label="doc" onAdd={(m) => addFile('problem', m)} onRemove={(id) => removeFile('problem', id)} /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Preliminary Spec — Mechanical</Label>
            <Input className="mt-1" value={charter.specMech || ''} onChange={(e) => set('specMech', e.target.value)} />
          </div>
          <div>
            <Label>Preliminary Spec — Electrical</Label>
            <Input className="mt-1" value={charter.specElec || ''} onChange={(e) => set('specElec', e.target.value)} />
          </div>
        </div>
        <FileBucket files={files.specs} label="spec" onAdd={(m) => addFile('specs', m)} onRemove={(id) => removeFile('specs', id)} />

        <div>
          <Label>Market Potential (business contribution vs competitors)</Label>
          <Textarea className="mt-1" value={charter.market || ''} onChange={(e) => set('market', e.target.value)} />
        </div>

        <div>
          <Label>Preliminary Business Case</Label>
          <Textarea className="mt-1" value={charter.businessCase || ''} onChange={(e) => set('businessCase', e.target.value)} />
          <div className="mt-1.5"><FileBucket files={files.business} label="doc" onAdd={(m) => addFile('business', m)} onRemove={(id) => removeFile('business', id)} /></div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm font-semibold mb-2">Core Team</div>
          <div className="grid grid-cols-2 gap-3">
            {TEAM_ROLES.map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input className="mt-1" value={charter[k] || ''} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Additional Team Members</div>
            <Button variant="outline" size="sm" onClick={addExtra}><Plus className="h-3.5 w-3.5" /> Add Member</Button>
          </div>
          {extraTeam.length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional members yet — add roles like Quality, PED, or Vendor Development.</p>
          ) : (
            <div className="space-y-2">
              {extraTeam.map((m, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <Label>Role</Label>
                    <Input className="mt-1" placeholder="e.g. Quality, PED, Vendor Dev" value={m.role || ''} onChange={(e) => setExtra(i, 'role', e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Person</Label>
                      <Input className="mt-1" value={m.person || ''} onChange={(e) => setExtra(i, 'person', e.target.value)} />
                    </div>
                    <button type="button" className="text-muted-foreground hover:text-destructive mb-2" onClick={() => removeExtra(i)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
