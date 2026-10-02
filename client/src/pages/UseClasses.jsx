import { useSyncExternalStore } from "react";
import { getLearners } from "./UseLearners";

// Tiny shared in-memory store so classes added or removed by a manager
// survive navigating between pages. Swap for apiClient calls once the
// classes endpoints are connected.
let classes = [
  { name: "Yellow", teacher: "Ms Nkosi", grade: "Gr 1-2", present: "2/2" },
  { name: "Green", teacher: "Mr Dlamini", grade: "Gr 3-4", present: "2/2" },
  { name: "Red", teacher: "Ms Williams", grade: "Gr 5-6", present: "1/1" },
  { name: "Blue", teacher: "Mr Naidoo", grade: "Gr 7", present: "0/1" },
  { name: "Orange", teacher: "Unassigned", grade: "Gr R", present: "0/0" },
];
const listeners = new Set();

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => classes;

export function addClass(cls) {
  classes = [...classes, cls];
  listeners.forEach((fn) => fn());
}

// Change which grade a class is assigned to. Use "Unassigned" for no grade.
// Backend equivalent: PATCH /classes/:classId with { gradeRange }.
export function updateClassGrade(name, grade) {
  classes = classes.map((c) => (c.name === name ? { ...c, grade } : c));
  listeners.forEach((fn) => fn());
}

// Assign a teacher to a class, or pass "Unassigned" to clear it.
// A teacher only leads one class here, so if they were on another class they
// are moved off it. Backend equivalent: PATCH /classes/:classId with
// { teacherId } (null to unassign).
export function assignTeacher(name, teacher) {
  classes = classes.map((c) => {
    if (c.name === name) return { ...c, teacher };
    if (teacher !== "Unassigned" && c.teacher === teacher) return { ...c, teacher: "Unassigned" };
    return c;
  });
  listeners.forEach((fn) => fn());
}

export function removeClass(name) {
  classes = classes.filter((c) => c.name !== name);
  listeners.forEach((fn) => fn());
}

// How many learners are in a class (active or deactivated: a deactivated
// learner still sits in their class, so the class can't be removed yet).
// Once the API returns learner_count, only the first line is needed.
export function learnerCount(cls) {
  if (typeof cls.learner_count === "number") return cls.learner_count;
  return getLearners().filter((l) => l.group === cls.name).length;
}

// Progress-bar colours for the dashboard "Class Overview" cards.
const BAR_STYLES = {
  yellow: { colour: "bg-yellow-400", text: "text-yellow-600" },
  green: { colour: "bg-green-400", text: "text-green-600" },
  red: { colour: "bg-red-400", text: "text-red-500" },
  blue: { colour: "bg-sky-400", text: "text-sky-500" },
  orange: { colour: "bg-orange-400", text: "text-orange-600" },
};

// Turns the shared class list into rows for the dashboard Class Overview,
// so every class (including Orange) shows up.
export function classOverviewRows(list) {
  return list.map((c) => {
    const [done, total] = String(c.present).split("/").map(Number);
    const style = BAR_STYLES[c.name.toLowerCase()] ?? { colour: "bg-gray-400", text: "text-gray-600" };
    return {
      name: c.name,
      value: c.present,
      width: total > 0 ? `${Math.round((done / total) * 100)}%` : "0%",
      ...style,
    };
  });
}

export function useClasses() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// When the endpoints are connected, removing a class becomes:
// try {
//   await apiClient.patch(`/classes/${cls.class_id}/deactivate`);
//   refetch();
// } catch (e) {
//   if (e.status === 409) setError(e.message); // server-side safety net
// }