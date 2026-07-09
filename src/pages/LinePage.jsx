import CrudPage from '@/components/crud/CrudPage';
import { LineRows } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { LR_EXIST, LR_READY, badgeForStatus } from '@/lib/constants';

const columns = [
  { key: 'proj', label: 'Project' },
  { key: 'process', label: 'Process' },
  { key: 'bomPart', label: 'BOM Part / Resp' },
  { key: 'existing', label: 'Existing/New' },
  { key: 'machine', label: 'Machine' },
  { key: 'fixture', label: 'Fixture' },
  { key: 'gauge', label: 'Gauge' },
  { key: 'cycleTime', label: 'Cycle Time' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'supplier', label: 'Supplier' },
  {
    key: 'readiness', label: 'Readiness',
    render: (r) => <Badge variant="outline" className={badgeForStatus(r.readiness)}>{r.readiness}</Badge>,
  },
];

const fields = [
  { key: 'proj', label: 'Project' },
  { key: 'process', label: 'Process' },
  { key: 'bomPart', label: 'BOM Part / Resp' },
  { key: 'existing', label: 'Existing / New', type: 'select', options: LR_EXIST },
  { key: 'readiness', label: 'Overall Readiness', type: 'select', options: LR_READY },
  { key: 'machine', label: 'Machine' },
  { key: 'fixture', label: 'Fixture' },
  { key: 'tools', label: 'Tools' },
  { key: 'gauge', label: 'Gauge' },
  { key: 'cycleTime', label: 'Cycle Time' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function LinePage() {
  return (
    <CrudPage
      title="Line Readiness"
      description="Process, tooling & validation readiness per assembly line"
      api={LineRows}
      columns={columns}
      fields={fields}
      searchKeys={['proj', 'process', 'machine', 'supplier', 'bomPart']}
      defaults={{ existing: 'New', readiness: 'Not Started' }}
      addLabel="Add Process"
    />
  );
}
