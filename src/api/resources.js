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

export const health = () => api.get('/../health').then((r) => r.data);
