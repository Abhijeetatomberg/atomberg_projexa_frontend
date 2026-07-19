import api from './client';

// One CRUD helper per backend resource (see backend src/router/index.js).
const crud = (path) => ({
  list: () => api.get(`/${path}`).then((r) => r.data),
  get: (id) => api.get(`/${path}/${id}`).then((r) => r.data),
  create: (body) => api.post(`/${path}`, body).then((r) => r.data),
  update: (id, body) => api.put(`/${path}/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/${path}/${id}`).then((r) => r.data),
});

export const Rfqs = crud('rfqs');
export const Npds = crud('npd-projects');
export const Pocs = crud('poc-projects');
export const BomParts = crud('bom-parts');
export const LineRows = crud('line-rows');
export const Reviews = crud('reviews');
export const MomActions = crud('mom-actions');
export const Ecns = crud('ecns');
export const PpapDocs = crud('ppap-docs');
export const Samples = crud('samples');
export const Trials = crud('trials');
export const StdDocs = crud('std-docs');
export const Resources = crud('resources');
export const Investments = crud('investments');
export const BudgetItems = crud('budget-items');
export const Users = crud('users');

export const login = (username, password) =>
  api.post('/users/login', { username, password }).then((r) => r.data);

export const askAi = (question, history) =>
  api.post('/ai/ask', { question, history }).then((r) => r.data);

// Fire-and-forget email notification — used when an approver is assigned to a
// pending Standards Library revision (mirrors notifyAssigned in the legacy app).
export const notifyTaskAssigned = (payload) =>
  api.post('/notify/task-assigned', payload).then((r) => r.data).catch(() => null);

export const health = () => api.get('/../health').then((r) => r.data);

// File attachments (S3-backed — see backend src/routes/attachmentRoutes.js).
// The instance's default 'Content-Type: application/json' header makes axios
// JSON-stringify FormData bodies instead of sending them as multipart, so it
// must be explicitly cleared here to let the browser set the multipart
// boundary itself.
export const uploadAttachment = (file, { module, refId, uploadedBy } = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (module) form.append('module', module);
  if (refId != null) form.append('refId', String(refId));
  if (uploadedBy) form.append('uploadedBy', uploadedBy);
  return api.post('/attachments', form, { headers: { 'Content-Type': undefined } }).then((r) => r.data);
};

export const attachmentUrl = (id) =>
  `${(import.meta.env.VITE_API_BASE || '/api')}/attachments/${id}`;

export const deleteAttachment = (id) => api.delete(`/attachments/${id}`).then((r) => r.data);
