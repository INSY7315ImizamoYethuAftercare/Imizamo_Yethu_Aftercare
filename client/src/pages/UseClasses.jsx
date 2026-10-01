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