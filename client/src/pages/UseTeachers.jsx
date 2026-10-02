// Teachers a manager can assign to a class. Mock data for now; swap for
// apiClient.get("/teachers") once connected (only active teachers should be
// returned for assignment). The `id` maps to teachers.teacher_id.
export const teachers = [
  { id: 1, name: "Ms Nkosi" },
  { id: 2, name: "Mr Dlamini" },
  { id: 3, name: "Ms Williams" },
  { id: 4, name: "Mr Naidoo" },
];

export const NO_TEACHER = "Unassigned";