import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from './FormFields';
import { toast } from '@/components/toaster';

// Generic list + add/edit/delete page used by the flat modules
// (BOM, Line, Samples, ECN, Investment, Budget, Resources, Standards, …).
//
// Props:
//  title, description  — header text
//  api                 — CRUD helper from src/api/resources.js
//  columns             — [{ key, label, render?(row), className? }]
//  fields              — form config for FormFields
//  searchKeys          — row keys the search box matches against
//  defaults            — initial values for a new record
//  headerExtra(rows)   — optional node rendered next to Add (e.g. KPI chips)
//  onRowClick(row)     — optional; overrides opening the edit dialog
//  transformOut(vals)  — optional; shape values before save
export default function CrudPage({
  title, description, api, columns, fields, searchKeys = [], defaults = {},
  headerExtra, onRowClick, transformOut, addLabel = 'Add',
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // row being edited, or null for create
  const [values, setValues] = useState(defaults);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await api.list());
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      (searchKeys.length ? searchKeys : columns.map((c) => c.key))
        .some((k) => String(r[k] ?? '').toLowerCase().includes(s))
    );
  }, [rows, q, searchKeys, columns]);

  const openCreate = () => { setEditing(null); setValues(defaults); setOpen(true); };
  const openEdit = (row) => { setEditing(row); setValues(row); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const body = transformOut ? transformOut(values) : values;
      if (editing) {
        const updated = await api.update(editing.id, body);
        setRows((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
        toast('Updated', 'success');
      } else {
        const created = await api.create(body);
        setRows((prev) => [...prev, created]);
        toast('Created', 'success');
      }
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.remove(editing.id);
      setRows((prev) => prev.filter((r) => r.id !== editing.id));
      toast('Deleted', 'success');
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex-1" />
        {headerExtra && headerExtra(rows)}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Reload">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={openCreate}><Plus /> {addLabel}</Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {error}. Is the backend running on port 4000?
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={columns.length + 1} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length + 1} className="py-10 text-center text-muted-foreground">No records yet</TableCell></TableRow>
          ) : (
            filtered.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => (onRowClick ? onRowClick(row) : openEdit(row))}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : String(row[c.key] ?? '—') || '—'}
                  </TableCell>
                ))}
                <TableCell onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${title}` : `Add — ${title}`}</DialogTitle>
          </DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" onClick={remove} className="mr-auto">
                <Trash2 /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
