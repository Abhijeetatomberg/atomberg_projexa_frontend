import CrudPage from '@/components/crud/CrudPage';
import { Samples } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/utils';
import { SAMPLE_ST, BUNITS, badgeForStatus } from '@/lib/constants';

const columns = [
  {
    key: 'status', label: 'Status',
    render: (r) => <Badge variant="outline" className={badgeForStatus(r.status)}>{r.status}</Badge>,
  },
  { key: 'cat', label: 'Category' },
  { key: 'project', label: 'Project' },
  { key: 'customer', label: 'Customer' },
  { key: 'spec', label: 'Spec' },
  { key: 'qty', label: 'Qty' },
  { key: 'reqDate', label: 'Req. Date', render: (r) => fmtDate(r.reqDate) },
  { key: 'plannedSub', label: 'Planned Sub.', render: (r) => fmtDate(r.plannedSub) },
  { key: 'submission', label: 'Submitted', render: (r) => fmtDate(r.submission) },
  { key: 'owner', label: 'Owner' },
];

const fields = [
  { key: 'status', label: 'Status', type: 'select', options: SAMPLE_ST },
  { key: 'cat', label: 'Category', type: 'select', options: BUNITS },
  { key: 'project', label: 'Project' },
  { key: 'customer', label: 'Customer' },
  { key: 'spec', label: 'Specification', span: 2 },
  { key: 'qty', label: 'Quantity' },
  { key: 'reqDate', label: 'Requirement Date', type: 'date' },
  { key: 'drawing', label: 'Drawing Availability' },
  { key: 'material', label: 'Material Availability' },
  { key: 'plannedSub', label: 'Planned Submission', type: 'date' },
  { key: 'assembly', label: 'Assembly Completion', type: 'date' },
  { key: 'inspection', label: 'Inspection Date', type: 'date' },
  { key: 'submission', label: 'Submission Date', type: 'date' },
  { key: 'owner', label: 'Owner' },
  { key: 'planner', label: 'Planner Remarks' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function SamplePage() {
  return (
    <CrudPage
      title="Sample Submission"
      description="Customer sample requests through assembly, inspection & submission"
      api={Samples}
      columns={columns}
      fields={fields}
      searchKeys={['project', 'customer', 'spec', 'owner', 'status']}
      defaults={{ status: 'New', cat: 'CF', customer: 'ATPL' }}
      addLabel="Add Sample"
    />
  );
}
