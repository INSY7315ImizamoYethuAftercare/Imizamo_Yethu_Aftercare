import { useSyncExternalStore } from "react";

// Shared in-memory store for staff so the Staff page and the class
// assignment sheet agree (suspending a teacher removes them from the picker).
// Swap for apiClient calls once connected: GET /teachers, and
// PATCH /teachers/:teacherId/deactivate | /activate. `id` maps to
// teachers.teacher_id.
export const NO_TEACHER = "Unassigned";

let staff = [
  { id: 1, name: "Ms Nkosi", role: "Teacher", status: "Active" },
  { id: 2, name: "Mr Dlamini", role: "Teacher", status: "Active" },
  { id: 3, name: "Ms Williams", role: "Teacher", status: "Active" },
  { id: 4, name: "Mr Naidoo", role: "Teacher", status: "Active" },
  { id: 5, name: "Sarah Botha", role: "Manager", status: "Active" },
];
const listeners = new Set();

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => staff;

export function setStaffStatus(id, status) {
  staff = staff.map((s) => (s.id === id ? { ...s, status } : s));
  listeners.forEach((fn) => fn());
}

export function useStaff() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// Teachers only (no managers), for the class assignment picker.
export const teachersOnly = (list) => list.filter((s) => s.role === "Teacher");