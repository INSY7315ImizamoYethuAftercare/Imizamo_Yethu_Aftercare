import { useEffect, useSyncExternalStore } from "react";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { getSessionRole, onSessionReset, useSession } from "../services/session";

// Shared store for learners, loaded from GET /api/learners (teachers and
// managers can read; only managers can change anything).
//
//  status "active" - normal
//  status "deactivated" - still listed (greyed out) but cannot be opened
//  deleted - removed from the database
//
// `grade` is the class's grade range (e.g. "Gr 1-2"): the database stores a
// grade range per class, not a grade per learner.
let learners = [];
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
  classColour: l.class_colour ?? null,
  status: l.is_active ? "active" : "deactivated",
  dateOfBirth: l.date_of_birth, // null until the client supplies it
  canWalkHomeAlone: l.can_walk_home_alone,
});

const canLoad = () => ["teacher", "manager"].includes(getSessionRole());

// Reloads the list. Calls made while one is already running share it, so
// several components opening at once make a single request.
let inFlight = null;
export function refreshLearners() {
  if (!canLoad()) return Promise.resolve();
  if (inFlight) return inFlight;
  loading = true;
  emit();
  inFlight = (async () => {
    try {
      learners = (await apiClient.get("/learners")).map(toLearner);
    } catch (e) {
      console.error("Could not load learners:", e);
    } finally {
      loading = false;
      inFlight = null;
      emit();
    }
  })();
  return inFlight;
}

onSessionReset(() => {
  learners = [];
  emit();
});
// A class's grade range changed.
dataBus.on("learners", refreshLearners);

const fail = (e) => alert(e.message || "Something went wrong. Please try again.");

export const getLearners = () => learners;

// Fetches one learner directly (GET /learners/:id), for when the shared
// list hasn't loaded yet — e.g. a deep link straight to a learner's page.
// Returns null on 404, same shape as entries in the shared `learners` list.
export async function fetchLearnerById(id) {
  try {
    return toLearner(await apiClient.get(`/learners/${id}`));
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

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

// Saves a learner's name, date of birth and (optionally) class
// (PATCH /learners/:id). Unlike the helpers above it doesn't alert: it throws,
// so the page can show its own error message. An empty dateOfBirth clears it.
export async function updateLearnerDetails(id, { firstName, lastName, dateOfBirth, classId }) {
  const before = learners.find((l) => l.id === id);
  const updated = await apiClient.patch(`/learners/${id}`, {
    firstName,
    lastName,
    dateOfBirth: dateOfBirth || null,
    ...(classId ? { classId } : {}),
  });
  learners = learners.map((l) =>
    l.id === id
      ? {
          ...l,
          firstName: updated.first_name,
          lastName: updated.last_name,
          name: `${updated.first_name} ${updated.last_name}`,
          dateOfBirth: updated.date_of_birth,
        }
      : l,
  );
  emit();
  // A new class changes the learner's class name and grade, and both
  // classes' counts: reload them.
  if (before && updated.class_id !== before.classId) {
    await refreshLearners();
    dataBus.emit("classes");
  }
  return updated;
}

// Moves learners to another class, one at a time (PATCH /learners/:id).
// Throws on the first failure, so the caller knows not to go on and
// remove the old class.
export async function moveLearners(ids, classId) {
  try {
    for (const id of ids) await apiClient.patch(`/learners/${id}`, { classId });
  } finally {
    await refreshLearners();
    dataBus.emit("classes");
  }
}

export function useLearners() {
  const { user } = useSession();
  // Reload whenever a page using the list opens, and when the user comes back
  // to the tab, so a learner the manager added or moved shows up for the
  // teacher without signing out and in again.
  useEffect(() => {
    if (!["teacher", "manager"].includes(user?.appRole)) return undefined;
    refreshLearners();
    window.addEventListener("focus", refreshLearners);
    return () => window.removeEventListener("focus", refreshLearners);
  }, [user]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const useLearnersLoading = () => useSyncExternalStore(subscribe, getLoading);
