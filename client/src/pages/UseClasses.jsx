import { useSyncExternalStore } from "react";

// Tiny shared in-memory store so classes added by a teacher or manager
// survive navigating between pages. Swap for apiClient calls once the
// classes endpoints exist on the server.
let classes = [
  { name: "Yellow", teacher: "Ms Nkosi", grade: "Gr 1-2", present: "2/2", colour: "bg-yellow-300" },
  { name: "Green", teacher: "Mr Dlamini", grade: "Gr 3-4", present: "2/2", colour: "bg-green-300" },
  { name: "Red", teacher: "Ms Williams", grade: "Gr 5-6", present: "1/1", colour: "bg-red-300" },
  { name: "Blue", teacher: "Mr Naidoo", grade: "Gr 7", present: "0/1", colour: "bg-sky-300" },
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

export function useClasses() {
  return useSyncExternalStore(subscribe, getSnapshot);
}