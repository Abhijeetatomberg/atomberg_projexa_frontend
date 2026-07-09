import CrudPage from '@/components/crud/CrudPage';
import { StdDocs } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/utils';
import { STD_CAT, badgeForStatus } from '@/lib/constants';

const columns = [
  { key: 'docNo', label: 'Doc No.' },
  { key: 'title', label: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
  { key: 'category', label: 'Category', render: (r) => <Badge variant="secondary">{r.category}</Badge> },
  { key: 'rev', label: 'Rev', render: (r) => `Rev ${r.rev ?? 1}` },
  { key: 'owner', label: 'Owner' },
  { key: 'effDate', label: 'Effective', render: (r) => fmtDate(r.effDate) },
  {
    key: 'status', label: 'Status',
    render: (r) => <Badge variant="outline" className={badgeForStatus(r.status)}>{r.status}</Badge>,
  },
  { key: 'remarks', label: 'Remarks' },
];

const fields = [
  { key: 'title', label: 'Document Title', span: 2 },
  { key: 'docNo', label: 'Document No.', placeholder: 'e.g. AIPL/PM/PR/01' },
  { key: 'category', label: 'Category', type: 'select', options: STD_CAT },
  { key: 'owner', label: 'Owner' },
  { key: 'effDate', label: 'Effective Date', type: 'date' },
  { key: 'rev', label: 'Revision', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Under Revision', 'Obsolete'] },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function StandardsPage() {
  return (
    <CrudPage
      title="Standards Library"
      description="Controlled reference documents — SOPs, work instructions, formats & standards"
      api={StdDocs}
      columns={columns}
      fields={fields}
      searchKeys={['title', 'docNo', 'category', 'owner']}
      defaults={{ category: 'Procedure (SOP)', rev: 1, status: 'Active' }}
      addLabel="Add Document"
    />
  );
}
