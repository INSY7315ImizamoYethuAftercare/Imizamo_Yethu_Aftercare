// Sample guardian overview, shaped like GET /api/guardian/children/:id/overview.
export const AISHA_OVERVIEW = {
  child: { learnerId: 3, firstName: 'Aisha', lastName: 'Petersen', name: 'Aisha Petersen', className: 'Yellow', gradeRange: 'Gr 1-2', canWalkHomeAlone: false },
  today: { date: '2026-10-05', status: 'present', timeIn: '14:05', signedOut: null },
  attendance: { periodDays: 30, presentDays: 17, markedDays: 18, percent: 94 },
  week: [
    { date: '2026-10-02', status: 'present', signedOut: { timeOut: '17:00', collectedBy: 'Zainab Hendricks' } },
    { date: '2026-10-01', status: 'absent', signedOut: null },
  ],
  pickups: [
    { guardianId: 1, fullName: 'Fatima Petersen', relationship: 'Mother', isPrimaryContact: true, isYou: true },
    { guardianId: 2, fullName: 'Ahmed Petersen', relationship: 'Father', isPrimaryContact: false, isYou: false },
  ],
  teacher: { name: 'Ms Nkosi', email: 'nkosi@iylh.org' },
  observations: [
    { observationId: 2, date: '2025-07-15', category: 'Social', rating: 8, notes: 'Showed great leadership during group activity today.', teacherName: 'Ms Nkosi' },
    { observationId: 1, date: '2025-07-10', category: 'Reading', rating: 6, notes: 'Reading short sentences with support.', teacherName: 'Ms Nkosi' },
  ],
}
