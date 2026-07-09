import CrudPage from '@/components/crud/CrudPage';
import { BomParts } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { BOM_TYPE, BOM_COMMON, BOM_OST, BOM_FPA, BUNITS, badgeForStatus } from '@/lib/constants';

const columns = [
  { key: 'cat', label: 'BU' },
  { key: 'proj', label: 'Project' },
  { key: 'pno', label: 'Part No.' },
  { key: 'desc', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'common', label: 'New/Old' },
  { key: 'qty', label: 'Qty' },
  { key: 'sourcing', label: 'Sourcing' },
  { key: 'toolMaker', label: 'Tool Maker' },
  {
    key: 'ost', label: 'Status',
    render: (r) => (r.ost ? <Badge variant="outline" className={badgeForStatus(r.ost)}>{r.ost}</Badge> : '—'),
  },
  {
    key: 'fpaStatus', label: 'FPA',
    render: (r) => (r.fpaStatus ? <Badge variant="outline" className={badgeForStatus(r.fpaStatus)}>{r.fpaStatus}</Badge> : '—'),
  },
];

const fields = [
  { key: 'cat', label: 'Business Unit', type: 'select', options: BUNITS },
  { key: 'proj', label: 'Project' },
  { key: 'pno', label: 'Part Number' },
  { key: 'desc', label: 'Description', span: 2 },
  { key: 'type', label: 'Type', type: 'select', options: BOM_TYPE },
  { key: 'common', label: 'New / Old / ECN', type: 'select', options: BOM_COMMON },
  { key: 'qty', label: 'Qty per Assy' },
  { key: 'ost', label: 'Overall Status', type: 'select', options: BOM_OST },
  { key: 'mechLead', label: 'Mech Lead' },
  { key: 'sourcing', label: 'Sourcing Owner' },
  { key: 'commodity', label: 'Commodity' },
  { key: 'mfgProcess', label: 'Mfg Process' },
  { key: 'volumes', label: 'Volumes' },
  { key: 'toolMaker', label: 'Tool Maker' },
  { key: 'partMaker', label: 'Part Maker' },
  { key: 'fpaStatus', label: 'FPA Status', type: 'select', options: BOM_FPA },
  { key: 'fpaNumber', label: 'FPA Number' },
  { key: 'cavity', label: 'Cavity' },
  { key: 'tonnage', label: 'Tonnage' },
  { key: 'machineMake', label: 'Machine Make' },
  { key: 'cycleTime', label: 'Cycle Time' },
];

export default function BomPage() {
  return (
    <CrudPage
      title="BOM Tracking"
      description="Bill of materials per project — parts, suppliers, tooling & FPA milestones"
      api={BomParts}
      columns={columns}
      fields={fields}
      searchKeys={['proj', 'pno', 'desc', 'toolMaker', 'partMaker', 'sourcing']}
      defaults={{ type: 'Dev', common: 'New' }}
      addLabel="Add Part"
    />
  );
}
