import CrudPage from '@/components/crud/CrudPage';
import { Ecns } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/utils';
import { ECN_STATUS, BUNITS, badgeForStatus } from '@/lib/constants';

const columns = [
  { key: 'ecnNo', label: 'ECN No.' },
  { key: 'projCat', label: 'BU' },
  { key: 'proj', label: 'Project' },
  { key: 'desc', label: 'Description' },
  {
    key: 'status', label: 'Status',
    render: (r) => <Badge variant="outline" className={badgeForStatus(r.status)}>{r.status}</Badge>,
  },
  { key: 'creator', label: 'Creator' },
  { key: 'ecnDate', label: 'ECN Date', render: (r) => fmtDate(r.ecnDate) },
  { key: 'approvedDate', label: 'Approved', render: (r) => fmtDate(r.approvedDate) },
  { key: 'plannedDate', label: 'Planned Impl.', render: (r) => fmtDate(r.plannedDate) },
  { key: 'implDate', label: 'Implemented', render: (r) => fmtDate(r.implDate) },
];

const fields = [
  { key: 'ecnNo', label: 'ECN Number' },
  { key: 'projCat', label: 'Business Unit', type: 'select', options: BUNITS },
  { key: 'proj', label: 'Project' },
  { key: 'status', label: 'Status', type: 'select', options: ECN_STATUS },
  { key: 'desc', label: 'Change Description', type: 'textarea' },
  { key: 'ecrAvail', label: 'ECR Available?' },
  { key: 'creator', label: 'Creator' },
  { key: 'ecnDate', label: 'ECN Date', type: 'date' },
  { key: 'approvedDate', label: 'Approved Date', type: 'date' },
  { key: 'plannedDate', label: 'Planned Implementation', type: 'date' },
  { key: 'implDate', label: 'Implementation Date', type: 'date' },
  { key: 'bomPart', label: 'BOM Part Affected' },
  { key: 'stockLine', label: 'Stock at Line' },
  { key: 'stockStore', label: 'Stock at Store' },
  { key: 'newPartInward', label: 'New Part Inward', type: 'date' },
];

export default function EcnPage() {
  return (
    <CrudPage
      title="ECN Tracker"
      description="Engineering change notices — approval, stock run-down & implementation"
      api={Ecns}
      columns={columns}
      fields={fields}
      searchKeys={['ecnNo', 'proj', 'desc', 'creator', 'bomPart']}
      defaults={{ status: 'Under Approval' }}
      addLabel="Add ECN"
    />
  );
}
