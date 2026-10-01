import { useSyncExternalStore } from "react";

// Shared in-memory store so what a manager does on the Learners page
// (add / deactivate / delete) is what teachers see. Swap for apiClient
// calls once the learner endpoints are connected.
//
//  status "active"       - normal
//  status "deactivated"  - still listed (greyed out) but cannot be opened
//  deleted               - removed from the list for everyone
let learners = [
  { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", status: "active" },
  { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green", status: "active" },
  { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", status: "active" },
  { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", status: "active" },
  { id: 5, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", status: "active" },
  { id: 6, name: "Sipho Dlamini", grade: "Grade 5", group: "Blue", status: "active" },
];
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => learners;

export const getLearners = () => learners;

export function addLearner(learner) {
  const id = learners.reduce((max, l) => Math.max(max, l.id), 0) + 1;
  learners = [...learners, { ...learner, id, status: "active" }];
  emit();
}

export function deleteLearner(id) {
  learners = learners.filter((l) => l.id !== id);
  emit();
}

export function setLearnerStatus(id, status) {
  learners = learners.map((l) => (l.id === id ? { ...l, status } : l));
  emit();
}

export function useLearners() {
  return useSyncExternalStore(subscribe, getSnapshot);
}