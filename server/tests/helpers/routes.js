// Every protected route, which roles may use it, and a valid request for it
// built from a buildWorld() result. Keep this in step with src/routes/*.js:
// the role matrix test is generated from it.
const ADMINS = ['admin_standard', 'admin_master']
const ALL = [...ADMINS, 'manager', 'teacher', 'guardian']

const route = (name, allowed, path, body) => {
  const [method] = name.split(' ')
  return { name, method: method.toLowerCase(), allowed, path, body }
}

export const PROTECTED_ROUTES = [
  route('GET /api/auth/me', ALL, () => '/api/auth/me'),

  route('POST /api/attendance', ['teacher'], () => '/api/attendance',
    (w) => ({ learnerId: w.learnerFresh.learner_id, status: 'present' })),
  route('GET /api/attendance/class/:classId', ['teacher', 'manager'], (w) => `/api/attendance/class/${w.yellowId}`),
  route('PATCH /api/attendance/:recordId', ['teacher'], (w) => `/api/attendance/${w.attendanceA.record_id}`,
    () => ({ status: 'absent' })),

  route('GET /api/signout/today', ['teacher', 'manager'], () => '/api/signout/today'),
  route('POST /api/signout/verify', ['teacher', 'manager'], () => '/api/signout/verify',
    (w) => ({ learnerId: w.learnerA.learner_id, guardianId: w.users.guardian.profile.guardian_id })),
  route('POST /api/signout/confirm', ['teacher', 'manager'], () => '/api/signout/confirm',
    (w) => ({ learnerId: w.learnerA.learner_id, guardianId: w.users.guardian.profile.guardian_id })),

  route('GET /api/guardian/children', ['guardian'], () => '/api/guardian/children'),
  route('GET /api/guardian/children/:learnerId', ['guardian'], (w) => `/api/guardian/children/${w.learnerA.learner_id}`),
  route('GET /api/guardian/children/:learnerId/observations', ['guardian'],
    (w) => `/api/guardian/children/${w.learnerA.learner_id}/observations`),
  route('PATCH /api/guardian/:guardianId/deactivate', ['manager'],
    (w) => `/api/guardian/${w.otherGuardian.profile.guardian_id}/deactivate`),
  route('PATCH /api/guardian/:guardianId/activate', ['manager'],
    (w) => `/api/guardian/${w.otherGuardian.profile.guardian_id}/activate`),

  route('POST /api/observations', ['teacher'], () => '/api/observations',
    (w) => ({ learnerId: w.learnerA.learner_id, category: 'Reading', rating: 6 })),
  route('GET /api/observations/learner/:learnerId', ['teacher'], (w) => `/api/observations/learner/${w.learnerA.learner_id}`),
  route('PATCH /api/observations/:observationId', ['teacher'], (w) => `/api/observations/${w.observationA.observation_id}`,
    () => ({ category: 'Reading', rating: 8 })),
  route('DELETE /api/observations/:observationId', ['teacher'], (w) => `/api/observations/${w.observationA.observation_id}`),

  // Live dashboard + donor report (manager + admins only)
  route('GET /api/reports/overview', ['manager', ...ADMINS],
    () => '/api/reports/overview'),
  route('GET /api/reports/donor', ['manager', ...ADMINS],
    () => '/api/reports/donor?periodStart=2026-01-01&periodEnd=2026-12-31'),

  route('GET /api/learners', ['manager', 'teacher'], () => '/api/learners'),
  route('GET /api/learners/:learnerId', ['manager', 'teacher'], (w) => `/api/learners/${w.learnerA.learner_id}`),
  route('POST /api/learners', ['manager'], () => '/api/learners',
    (w) => ({ classId: w.yellowId, firstName: 'New', lastName: 'Learner', dateOfBirth: '2019-01-01' })),
  route('PATCH /api/learners/:learnerId', ['manager'], (w) => `/api/learners/${w.learnerA.learner_id}`,
    () => ({ firstName: 'Aisha-May' })),
  route('DELETE /api/learners/:learnerId', ['manager'], (w) => `/api/learners/${w.learnerFresh.learner_id}`),

  route('GET /api/classes', ['manager', 'teacher'], () => '/api/classes'),
  route('GET /api/classes/:classId', ['manager', 'teacher'], (w) => `/api/classes/${w.yellowId}`),
  route('POST /api/classes', ['manager'], () => '/api/classes',
    () => ({ className: 'Purple', gradeRange: 'Gr 1' })),
  route('PATCH /api/classes/:classId', ['manager'], (w) => `/api/classes/${w.yellowId}`,
    () => ({ gradeRange: 'Gr 1-3' })),
  route('PATCH /api/classes/:classId/deactivate', ['manager'], (w) => `/api/classes/${w.orangeId}/deactivate`),
  route('PATCH /api/classes/:classId/activate', ['manager'], (w) => `/api/classes/${w.orangeId}/activate`),
  route('GET /api/classes/:classId/learners', ['manager', 'teacher'], (w) => `/api/classes/${w.yellowId}/learners`),

  route('GET /api/teacher', ['manager'], () => '/api/teacher'),
  route('POST /api/teacher', ['manager'], () => '/api/teacher',
    () => ({ email: 'new.teacher@test.iylh.org', password: 'Long-enough-1', fullName: 'New Teacher' })),
  route('PATCH /api/teacher/:teacherId', ['manager'], (w) => `/api/teacher/${w.users.teacher.profile.teacher_id}`,
    () => ({ fullName: 'Renamed Teacher' })),
  route('PATCH /api/teacher/:teacherId/deactivate', ['manager'],
    (w) => `/api/teacher/${w.users.teacher.profile.teacher_id}/deactivate`),
  route('PATCH /api/teacher/:teacherId/activate', ['manager'],
    (w) => `/api/teacher/${w.users.teacher.profile.teacher_id}/activate`),
]

/** Sends a catalogue route as the given user (or anonymously when user is null). */
export function send(agent, r, world, user) {
  let req = agent[r.method](r.path(world))
  if (user) req = req.set('Cookie', user.cookie)
  if (r.body) req = req.send(r.body(world))
  return req
}
