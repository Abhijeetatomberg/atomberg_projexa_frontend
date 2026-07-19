// Domain vocabularies, copied from the original Projexa HTML app so the
// React UI and any legacy data stay in the same language.
import gates from './gates.json';

export const GATES = gates.GATES;               // AB-0..AB-7 with task templates
export const GATE_EXIT = gates.GATE_EXIT;       // exit criteria per gate
export const GATE_DELIV = gates.GATE_DELIV;     // deliverables per gate
export const POC_GATES = gates.POC_GATES;       // POC stage task templates
export const GATE_APPLIC = gates.GATE_APPLIC;   // gate applicability per category

export const GATE_LABELS = ['KO Required', 'AB-0', 'AB-1', 'AB-2', 'AB-3', 'AB-4', 'AB-5', 'AB-6', 'AB-7'];

export const RFQ_STAGES = [
  { k: 'draft', label: 'Draft', color: '#64748b' },
  { k: 'rd', label: 'R&D Review', color: '#7c3aed' },
  { k: 'costing', label: 'Costing', color: '#0891b2' },
  { k: 'bd', label: 'BD Pricing', color: '#d97706' },
  { k: 'won', label: 'Won', color: '#059669' },
  { k: 'lost', label: 'Lost', color: '#dc2626' },
];

export const NPD_CATS = [
  { c: 'CAT 1', d: 'New concept, New platform (G0/POC)' },
  { c: 'CAT 2', d: 'New concept, Existing platform' },
  { c: 'CAT 3', d: 'Design freeze, New platform' },
  { c: 'CAT 4', d: 'Design freeze, Existing platform' },
  { c: 'CAT 5', d: 'Existing part, New customer' },
  { c: 'CAT 6', d: 'Aftermarket sale' },
];

export const POC_STAGE_LABELS = ['POC KO', 'Alpha Build', 'Beta Build', 'Beta 2 Build', 'Customer Approval'];
// Stages that can be marked "not required" and skipped over — mirrors POC_SKIPPABLE in the legacy app
export const POC_SKIPPABLE = { 2: true, 3: true };

export const TASK_ST = ['Not Started', 'On Track', 'Behind Schedule', 'Delayed', 'At Risk', 'Completed', 'Completed After Delay'];
export const ACTION_ST = ['Open', 'In Progress', 'Done', 'Blocked'];

export const POC_PROC = ['To procure', 'Ordered', 'Received'];
export const POC_SRC = ['In-house', 'Bought-out', 'Vendor', 'RPT / Wire-cut'];
export const POC_USED = ['Alpha', 'Beta', 'Beta 2'];

export const BOM_TYPE = ['Dev', 'BO', 'Assy'];
export const BOM_COMMON = ['New', 'Old', 'ECN'];
export const BOM_OST = ['', 'On track', 'At Risk', 'WIP', 'Delayed', 'Delayed but Completed', 'Completed on time', 'New Part', 'Existing part', 'Standard Part'];
export const BOM_FPA = ['', 'FPA Approved', 'FPA pending', 'FPA pending - ECN', 'Standard Part', 'Not applicable'];
export const BOM_MS = [
  ['drawing', 'Drawing & 2D/3D release'],
  ['supplierId', 'Supplier identification & finalization'],
  ['toolOnboard', 'Tool supplier onboarding'],
  ['dfmInit', 'DFM/TFC initiation'],
  ['dfmClosure', 'DFM/TFC supplier closure'],
  ['commercial', 'Commercial finalization & PO'],
  ['tmko', 'TMKO'],
  ['toolReady', 'Tool ready'],
  ['toolT0', 'Tool maker T0'],
  ['partsReceipt', 'Parts receipt at AIC/AIPL'],
  ['fpaClosureAic', 'Tool maker FPA closure at AIC'],
  ['partSupplierFpa', 'Part supplier FPA'],
  ['ppap', 'PPAP date'],
];

export const LR_EXIST = ['New', 'Existing'];
export const LR_READY = ['Not Started', 'In Progress', 'Ready', 'At Risk', 'Delayed', 'Completed'];
export const LR_MS = [
  ['mbom', 'M-BOM released', 'src'],
  ['routing', 'Routing / SAP work centers', 'src'],
  ['layout', 'Line layout & balancing', 'src'],
  ['fixtures', 'Fixtures & poka-yoke ready', 'build'],
  ['gauges', 'Gauges & MSA done', 'build'],
  ['wi', 'Work instructions ready', 'build'],
  ['training', 'Operator training', 'build'],
  ['fpa', 'First-off / FPA', 'val'],
  ['rar', 'Run-at-rate', 'val'],
  ['cpk', 'Process capability (Cpk)', 'val'],
  ['signoff', 'Line sign-off', 'val'],
];

export const PPAP_STATUS = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Interim Approval', 'Rejected'];
export const PPAP_ELEMENTS = [
  'Design Records', 'Engineering Change Documents', 'Customer Engineering Approval',
  'Design FMEA', 'Process Flow Diagram', 'Process FMEA', 'Control Plan',
  'Measurement System Analysis (MSA)', 'Dimensional Results', 'Material / Performance Test Results',
  'Initial Process Studies (SPC)', 'Qualified Laboratory Documentation', 'Appearance Approval Report',
  'Sample Production Parts', 'Master Sample', 'Checking Aids',
  'Customer-Specific Requirements', 'Part Submission Warrant (PSW)',
];

export const TRIAL_SECTION = ['Motor', 'EMS'];
export const TRIAL_DEPT = ['Production', 'R&D', 'PED', 'Quality', 'Project Management', 'PPC', 'VD & Sourcing'];
export const TRIAL_TYPE = ['FPA', 'POC', 'R&D Trial', 'VD/Sourcing Trial', 'Production Trial', 'VAVE Trial', 'Quality Trial', 'Product improvement', 'Material change', 'Equipment change', 'Process Improvement', 'Other'];
export const TRIAL_STATUS = ['Draft', 'Submitted', 'In Process', 'Closed'];
export const HOD_ROLES = [
  ['production', 'Production HOD'],
  ['rnd', 'R&D HOD'],
  ['ped', 'PED HOD'],
  ['qa', 'QA HOD'],
  ['pm', 'Project Management'],
  ['plantHead', 'Plant Head'],
];

export const SAMPLE_ST = ['New', 'In Progress', 'On Hold', 'Delayed', 'Delayed but Completed', 'Submitted', 'Completed', 'Dropped'];
export const STD_CAT = ['Policy', 'Procedure (SOP)', 'Work Instruction (WI)', 'Format / Template', 'Standard', 'Manual / Guideline', 'Other'];
export const ECN_STATUS = ['Under Approval', 'Approved', 'Implemented', 'On Hold', 'Rejected'];

export const DEPTS = [
  { n: 'R&D', c: '#2563eb' },
  { n: 'Sourcing', c: '#7c3aed' },
  { n: 'Production', c: '#d97706' },
  { n: 'Quality', c: '#059669' },
  { n: 'BD', c: '#db2777' },
  { n: 'PM', c: '#0891b2' },
];
export const BUNITS = ['CF', 'TPW', 'REF', 'Drone', 'Compressor', 'Aircon', 'Commercial Aircon', 'Cooler motor'];
export const DEV_TYPES = ['POC', 'NPD'];
export const BUDGET_CATS = ['Tooling', 'Prototyping', 'Testing', 'Materials', 'Labor', 'Consulting', 'Other'];

export const STATUS_COLORS = {
  done: 'bg-emerald-100 text-emerald-700',
  ontrack: 'bg-blue-100 text-blue-700',
  behind: 'bg-amber-100 text-amber-700',
  atrisk: 'bg-orange-100 text-orange-700',
  delayed: 'bg-red-100 text-red-700',
  ns: 'bg-slate-100 text-slate-600',
};

export const badgeForStatus = (s = '') => {
  const t = s.toLowerCase();
  if (/(approved|completed|done|won|ready|closed|active|implemented)/.test(t) && !/delayed/.test(t)) return 'bg-emerald-100 text-emerald-700';
  if (/(progress|track|submitted|in process|wip|costing)/.test(t)) return 'bg-blue-100 text-blue-700';
  if (/(behind|hold|interim|pending|under approval|draft)/.test(t)) return 'bg-amber-100 text-amber-700';
  if (/(risk)/.test(t)) return 'bg-orange-100 text-orange-700';
  if (/(delayed|lost|rejected|blocked|dropped)/.test(t)) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
};
