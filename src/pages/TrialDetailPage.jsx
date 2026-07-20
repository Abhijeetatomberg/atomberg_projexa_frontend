import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Send, CheckCircle2, XCircle, Lock, Paperclip, Download, X, Loader2,
} from 'lucide-react';
import { Trials, uploadAttachment, attachmentUrl, deleteAttachment } from '@/api/resources';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { TRIAL_SECTION, TRIAL_DEPT, TRIAL_TYPE, HOD_ROLES, badgeForStatus } from '@/lib/constants';
import { fmtDate, todayIso } from '@/lib/utils';

const requestFields = [
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
  { key: 'prevTrialRef', label: 'Previous Trial Ref.' },
  { key: 'prevResultRemarks', label: 'Previous Result Remarks' },
];

const executionFields = [
  { key: 'machineSlot', label: 'Machine / Slot' },
  { key: 'slotAssignedDate', label: 'Slot Assigned Date', type: 'date' },
  { key: 'area', label: 'Area / Machine / Line' },
  { key: 'trialStartDate', label: 'Trial Start', type: 'date' },
  { key: 'trialEndDate', label: 'Trial End', type: 'date' },
  { key: 'duration', label: 'Trial Duration (period)' },
  { key: 'coordinator', label: 'Coordinator' },
  { key: 'storageLocation', label: 'Storage Location' },
  { key: 'feedback', label: 'Feedback / Results', type: 'textarea' },
  { key: 'finalDecision', label: 'Final Decision', type: 'textarea' },
];

export default function TrialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [t, setT] = useState(null);
  const [vals, setVals] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    Trials.get(id).then((r) => { setT(r); setVals(r); }).catch((e) => toast(e.message, 'error'));
  }, [id]);

  const patch = async (body) => {
    try {
      const u = await Trials.update(t.id, body);
      setT(u);
      setVals(u);
      return u;
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  if (!t) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const isOwner = t.originator && (t.originator === user?.name || t.originator === user?.username);
  const ownerOrAdmin = isAdmin || isOwner;
  // HOD sign-off can be tracked any time after submission by the owner/admin — it's
  // recording the physical sign-off, so it isn't locked to a single status.
  const hodEditable = ownerOrAdmin && t.status !== 'Draft' && t.status !== 'Closed';
  const allApproved = HOD_ROLES.every(([k]) => t.hod?.[k] === 'Approved');

  const setHod = async (k, decision) => {
    const hod = { ...(t.hod || {}), [k]: decision };
    const body = { hod };
    // All six sign-offs → trial moves into process
    if (HOD_ROLES.every(([r]) => hod[r] === 'Approved') && t.status === 'Submitted') body.status = 'In Process';
    await patch(body);
  };

  const submit = async () => {
    if (!vals.project || !vals.objective) {
      toast('Fill in Project Name and Objective before submitting', 'error');
      return;
    }
    await patch({ ...vals, status: 'Submitted', submissionDate: todayIso() });
    toast('Trial submitted for HOD approvals', 'success');
  };

  const close = async () => {
    if (!t.signedUploaded || !(t.files || []).length) {
      toast('Upload the signed copy before closing this trial', 'error');
      return;
    }
    if (!confirm(`Close "${t.trialNo}"? This marks the trial as fully complete.`)) return;
    await patch({ ...vals, status: 'Closed', closureDate: todayIso() });
    toast('Trial closed', 'success');
  };

  const attachFile = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const meta = await uploadAttachment(file, { module: 'trial', refId: t.id, uploadedBy: user?.name });
      const files = [...(t.files || []), meta];
      await patch({ files, signedUploaded: true });
      toast('Signed copy attached', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId) => {
    try {
      await deleteAttachment(fileId);
      const files = (t.files || []).filter((f) => f.id !== fileId);
      await patch({ files, signedUploaded: files.length > 0 });
      toast('File removed', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trials')}><ArrowLeft /></Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {t.trialNo}
            <Badge variant="outline" className={badgeForStatus(t.status)}>{t.status}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.project || 'No project'} · {t.section} · {t.dept} · Raised by {t.originator} on {fmtDate(t.date)}
          </p>
        </div>
        <div className="flex-1" />
        {t.status === 'Draft' && <Button onClick={submit}><Send /> Submit for Approval</Button>}
        {t.status === 'In Process' && <Button onClick={close}><Lock /> Close Trial</Button>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Trial Request</CardTitle></CardHeader>
          <CardContent>
            <FormFields fields={requestFields} values={vals} onChange={setVals} />
            {t.status === 'Draft' && (
              <Button className="mt-4" variant="outline" onClick={async () => { await patch(vals); toast('Saved', 'success'); }}>
                Save Draft
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">HOD Approvals</CardTitle>
            {allApproved && <Badge className="bg-emerald-600">All Approved</Badge>}
          </CardHeader>
          <CardContent className="space-y-2">
            {HOD_ROLES.map(([k, label]) => {
              const st = t.hod?.[k] || 'Pending';
              return (
                <div key={k} className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <span className="text-[13px] flex-1">{label}</span>
                  <Badge variant="outline" className={badgeForStatus(st)}>{st}</Badge>
                  {hodEditable && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" title="Approve" onClick={() => setHod(k, 'Approved')}>
                        <CheckCircle2 />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" title="Reject" onClick={() => setHod(k, 'Rejected')}>
                        <XCircle />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            <p className="text-[11px] text-muted-foreground pt-1">
              {ownerOrAdmin
                ? 'Approvals are enabled once the trial is submitted. All six sign-offs move it to “In Process”.'
                : `Only ${t.originator || 'the originator'} or an admin can record HOD sign-offs.`}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Signed Copy</CardTitle>
            {t.signedUploaded
              ? <Badge className="bg-emerald-600">Uploaded</Badge>
              : <Badge variant="outline">Not uploaded</Badge>}
          </CardHeader>
          <CardContent className="space-y-2">
            {(t.files || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No signed copy attached yet.</p>
            ) : (
              <ul className="space-y-1">
                {t.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm">
                    <a
                      href={attachmentUrl(f.id)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 truncate text-primary hover:underline" title={f.name}
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </a>
                    {ownerOrAdmin && (
                      <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => removeFile(f.id)} title="Remove">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {ownerOrAdmin && (
              <>
                <input ref={fileInputRef} type="file" className="hidden" onChange={attachFile} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                  {uploading ? 'Uploading…' : 'Attach signed copy'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-sm">Execution & Closure</CardTitle></CardHeader>
          <CardContent>
            <FormFields fields={executionFields} values={vals} onChange={setVals} />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={async () => { await patch(vals); toast('Saved', 'success'); }}>Save</Button>
              <Button
                variant="destructive" className="ml-auto"
                onClick={async () => {
                  if (!confirm(`Delete trial ${t.trialNo}? This cannot be undone.`)) return;
                  await Trials.remove(t.id);
                  navigate('/trials');
                }}
              >
                Delete Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
