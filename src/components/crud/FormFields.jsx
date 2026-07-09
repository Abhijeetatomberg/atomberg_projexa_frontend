import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Renders a form from a field config array:
// { key, label, type: 'text'|'number'|'date'|'select'|'textarea', options: [], span: 1|2, placeholder }
export default function FormFields({ fields, values, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => {
        const val = values[f.key] ?? '';
        const set = (v) => onChange({ ...values, [f.key]: v });
        return (
          <div key={f.key} className={cn('space-y-1.5', (f.span === 2 || f.type === 'textarea') && 'col-span-2')}>
            <Label>{f.label}</Label>
            {f.type === 'select' ? (
              <Select value={String(val) || undefined} onValueChange={set}>
                <SelectTrigger><SelectValue placeholder={f.placeholder || 'Select…'} /></SelectTrigger>
                <SelectContent>
                  {(f.options || []).filter((o) => o !== '').map((o) => {
                    const value = typeof o === 'object' ? o.value : o;
                    const label = typeof o === 'object' ? o.label : o;
                    return <SelectItem key={value} value={String(value)}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            ) : f.type === 'textarea' ? (
              <Textarea value={val} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />
            ) : (
              <Input
                type={f.type || 'text'}
                value={val}
                placeholder={f.placeholder}
                onChange={(e) => set(f.type === 'number' ? e.target.valueAsNumber || 0 : e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
