// Standards Library revision/approval workflow helpers, ported from the
// legacy app's stdInit/stdCanManage/checkStdPromote.
export const DEPT_COLORS = { rd: '#7c3aed', quality: '#0891b2', production: '#d97706', pm: '#2563eb', ppc: '#059669', procurement: '#db2777' };

export const twoLetterInitials = (name = '') => {
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] || '?').slice(0, 2).toUpperCase();
};

export const stdCanManage = (doc, user, isAdmin) =>
  isAdmin || !!(user && doc.owner && (user.name === doc.owner || user.username === doc.owner));

export const isApprover = (appr, user, isAdmin) =>
  isAdmin || !!(user && (user.name === appr.approver || user.username === appr.approver));

// Every required approval (i.e. not "Not Required") must be Approved before the
// pending revision can go live — mirrors checkStdPromote's gate condition.
export const revisionReady = (pendingRev) =>
  !!pendingRev && pendingRev.approvals.every((a) => a.status === 'Approved' || a.status === 'Not Required');

// Builds the patch to apply once every approval is in: promotes pendingRev to
// live, files roll over, prior "Live" history entry becomes "Superseded".
export const promoteRevision = (doc) => {
  const rev = { ...doc.pendingRev, status: 'Live' };
  const history = (doc.history || []).map((h) => (h.status === 'Live' ? { ...h, status: 'Superseded' } : h));
  return {
    rev: rev.rev,
    status: 'Active',
    pendingRev: null,
    files: rev.files?.length ? rev.files : doc.files,
    history: [rev, ...history],
  };
};

export const initialHistoryEntry = (doc) => ([{
  rev: doc.rev || 1, date: doc.effDate || '', reason: 'Initial release', changedBy: doc.owner || '', status: 'Live', approvals: [],
}]);
