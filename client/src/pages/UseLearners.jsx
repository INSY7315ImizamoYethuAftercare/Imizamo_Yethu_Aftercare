import { useEffect, useSyncExternalStore } from "react";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { getSessionRole, onSessionReset, useSession } from "../services/session";

// Shared store for learners, loaded from GET /api/learners (teachers and
// managers can read; only managers can change anything).
//
//  status "active"       - normal
//  status "deactivated"  - still listed (greyed out) but cannot be opened
//  deleted               - removed from the database
//
// `grade` is the class's grade range (e.g. "Gr 1-2"): the database stores a
// grade range per class, not a grade per learner.
let learners = [];
let loaded = false;
let loading = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => learners;
const getLoading = () => loading;

const toLearner = (l) => ({
  id: l.learner_id,
  classId: l.class_id,
  firstName: l.first_name,
  lastName: l.last_name,
  name: `${l.first_name} ${l.last_name}`,
  grade: l.grade_range,
  group: l.class_name,
  status: l.is_active ? "active" : "deactivated",
  dateOfBirth: l.date_of_birth, // null until the client supplies it
  canWalkHomeAlone: l.can_walk_home_alone,
});

const canLoad = () => ["teacher", "manager"].includes(getSessionRole());

export async function refreshLearners() {
  if (!canLoad()) return;
  loading = true;
  emit();
  try {
    learners = (await apiClient.get("/learners")).map(toLearner);
    loaded = true;
  } catch (e) {
    console.error("Could not load learners:", e);
  } finally {
    loading = false;
    emit();
  }
}

onSessionReset(() => {
  learners = [];
  loaded = false;
  emit();
});
// A class's grade range changed.
dataBus.on("learners", refreshLearners);

const fail = (e) => alert(e.message || "Something went wrong. Please try again.");

export const getLearners = () => learners;

// learner: { firstName, lastName, classId, dateOfBirth? }
export async function addLearner({ firstName, lastName, classId, dateOfBirth }) {
  try {
    await apiClient.post("/learners", {
      classId,
      firstName,
      lastName,
      ...(dateOfBirth ? { dateOfBirth } : {}),
    });
    await refreshLearners();
    dataBus.emit("classes");
  } catch (e) {
    fail(e);
  }
}

export async function deleteLearner(id) {
  try {
    await apiClient.delete(`/learners/${id}`);
    learners = learners.filter((l) => l.id !== id);
    emit();
    dataBus.emit("classes");
  } catch (e) {
    // 409 when the learner has attendance, observations or sign-out records.
    fail(e.status === 409 ? new Error("This learner has attendance or other records, so they can't be deleted. Deactivate them instead.") : e);
  }
}

export async function setLearnerStatus(id, status) {
  try {
    await apiClient.patch(`/learners/${id}`, { isActive: status === "active" });
    learners = learners.map((l) => (l.id === id ? { ...l, status } : l));
    emit();
    dataBus.emit("classes");
  } catch (e) {
    fail(e);
  }
}

export function useLearners() {
  const { user } = useSession();
  useEffect(() => {
    if (["teacher", "manager"].includes(user?.role) && !loaded && !loading) refreshLearners();
  }, [user]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const useLearnersLoading = () => useSyncExternalStore(subscribe, getLoading);
