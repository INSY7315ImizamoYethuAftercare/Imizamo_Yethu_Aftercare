import { useEffect, useSyncExternalStore } from "react";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { getSessionRole, onSessionReset, useSession } from "../services/session";
import { getStaff, NO_TEACHER } from "./UseTeachers";
import { colourForClass } from "./AddClassSheet";

// Shared store for classes, loaded from GET /api/classes (teachers and
// managers). Pages still address a class by its name (Yellow, Green, ...),
// which is unique among active classes, so the helpers below look up the
// class_id themselves.
let classes = [];
let loading = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => classes;
const getLoading = () => loading;

const toClass = (c) => ({
  id: c.class_id,
  name: c.class_name,
  grade: c.grade_range,
  // Hex colour chosen when the class was added; null for the original five,
  // which take the colour of their name (see colourForClass).
  colour: c.colour ?? null,
  teacher: c.teacher_name ?? NO_TEACHER,
  teacherId: c.teacher_id,
  // "marked present today / active learners"
  present: `${c.present_today}/${c.active_learner_count}`,
  // Every learner in the class, active or not (a deactivated learner still
  // sits in their class, so the class can't be removed yet).
  learner_count: c.learner_count,
});

const canLoad = () => ["teacher", "manager"].includes(getSessionRole());

// Reloads the list. Calls made while one is already running share it, so
// several components opening at once make a single request.
let inFlight = null;
export function refreshClasses() {
  if (!canLoad()) return Promise.resolve();
  if (inFlight) return inFlight;
  loading = true;
  emit();
  inFlight = (async () => {
    try {
      classes = (await apiClient.get("/classes")).map(toClass);
    } catch (e) {
      console.error("Could not load classes:", e);
    } finally {
      loading = false;
      inFlight = null;
      emit();
    }
  })();
  return inFlight;
}

onSessionReset(() => {
  classes = [];
  emit();
});
// Adding/removing learners changes a class's counts.
dataBus.on("classes", refreshClasses);

// Current snapshot, for other code that isn't a React component.
export const getClasses = () => classes;

const idFor = (name) => classes.find((c) => c.name === name)?.id;
const fail = (e) => alert(e.message || "Something went wrong. Please try again.");

// Unlike the helpers below it doesn't alert: it throws (e.g. 409 for a name
// that's taken), so the form can show the message.
// `teacher` is an optional teacher's name. A teacher only leads one class, so
// if they were on another class they are moved off it first (and put back if
// the new class is refused).
export async function addClass({ name, grade, colour, teacher }) {
  let teacherId = null;
  let other = null;
  if (teacher && teacher !== NO_TEACHER) {
    teacherId = getStaff().find((s) => s.role === "Teacher" && s.name === teacher)?.id;
    if (!teacherId) throw new Error(`Could not find teacher "${teacher}".`);
    other = classes.find((c) => c.teacherId === teacherId) ?? null;
    if (other) await apiClient.patch(`/classes/${other.id}`, { teacherId: null });
  }
  try {
    await apiClient.post("/classes", {
      className: name,
      gradeRange: grade,
      ...(colour ? { colour } : {}),
      ...(teacherId ? { teacherId } : {}),
    });
  } catch (e) {
    if (other) await apiClient.patch(`/classes/${other.id}`, { teacherId }).catch(() => {});
    throw e;
  } finally {
    await refreshClasses();
  }
}

// Change which grade a class is assigned to ("Unassigned" for no grade).
export async function updateClassGrade(name, grade) {
  const id = idFor(name);
  if (!id) return;
  try {
    await apiClient.patch(`/classes/${id}`, { gradeRange: grade });
    await refreshClasses();
    dataBus.emit("learners"); // learner rows show their class's grade
  } catch (e) {
    fail(e);
  }
}

// Assign a teacher to a class, or pass "Unassigned" to clear it. A teacher
// only leads one class here, so if they were on another class they are moved
// off it first.
export async function assignTeacher(name, teacherName) {
  const id = idFor(name);
  if (!id) return;
  try {
    let teacherId = null;
    if (teacherName !== NO_TEACHER) {
      teacherId = getStaff().find((s) => s.role === "Teacher" && s.name === teacherName)?.id;
      if (!teacherId) throw new Error(`Could not find teacher "${teacherName}".`);
      const other = classes.find((c) => c.teacherId === teacherId && c.id !== id);
      if (other) await apiClient.patch(`/classes/${other.id}`, { teacherId: null });
    }
    await apiClient.patch(`/classes/${id}`, { teacherId });
  } catch (e) {
    fail(e);
  } finally {
    await refreshClasses();
  }
}

// "Removing" a class deactivates it (kept in the database, hidden here).
// Returns true when it worked.
export async function removeClass(name) {
  const id = idFor(name);
  if (!id) return false;
  try {
    await apiClient.patch(`/classes/${id}/deactivate`);
    await refreshClasses();
    return true;
  } catch (e) {
    fail(e); // 409 if learners are still active in the class
    return false;
  }
}

// How many learners are in a class (active or deactivated).
export function learnerCount(cls) {
  return typeof cls.learner_count === "number" ? cls.learner_count : 0;
}

// Turns a class list into rows for the dashboard Class Overview, so every
// class (including Orange) shows up. `hex` is the same colour the Reports
// page and Classes list use for that class (its saved colour, if it has one).
export function classOverviewRows(list) {
  return list.map((c) => {
    const [done, total] = String(c.present).split("/").map(Number);
    return {
      name: c.name,
      value: c.present,
      width: total > 0 ? `${Math.round((done / total) * 100)}%` : "0%",
      hex: colourForClass(c.name, c.colour),
    };
  });
}

export function useClasses() {
  const { user } = useSession();
  // Reload whenever a page using the list opens, and when the user comes back
  // to the tab, so changes made by someone else (e.g. the manager moving a
  // learner) show up without signing out and in again.
  useEffect(() => {
    if (!["teacher", "manager"].includes(user?.appRole)) return undefined;
    refreshClasses();
    window.addEventListener("focus", refreshClasses);
    return () => window.removeEventListener("focus", refreshClasses);
  }, [user]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const useClassesLoading = () => useSyncExternalStore(subscribe, getLoading);
