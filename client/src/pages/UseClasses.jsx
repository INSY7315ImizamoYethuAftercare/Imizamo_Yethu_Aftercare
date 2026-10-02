import { useEffect, useSyncExternalStore } from "react";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { getSessionRole, onSessionReset, useSession } from "../services/session";
import { getStaff, NO_TEACHER } from "./UseTeachers";

// Shared store for classes, loaded from GET /api/classes (teachers and
// managers). Pages still address a class by its name (Yellow, Green, ...),
// which is unique among active classes, so the helpers below look up the
// class_id themselves.
let classes = [];
let loaded = false;
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
  teacher: c.teacher_name ?? NO_TEACHER,
  teacherId: c.teacher_id,
  // "marked present today / active learners"
  present: `${c.present_today}/${c.active_learner_count}`,
  // Every learner in the class, active or not (a deactivated learner still
  // sits in their class, so the class can't be removed yet).
  learner_count: c.learner_count,
});

const canLoad = () => ["teacher", "manager"].includes(getSessionRole());

export async function refreshClasses() {
  if (!canLoad()) return;
  loading = true;
  emit();
  try {
    classes = (await apiClient.get("/classes")).map(toClass);
    loaded = true;
  } catch (e) {
    console.error("Could not load classes:", e);
  } finally {
    loading = false;
    emit();
  }
}

onSessionReset(() => {
  classes = [];
  loaded = false;
  emit();
});
// Adding/removing learners changes a class's counts.
dataBus.on("classes", refreshClasses);

// Current snapshot, for other code that isn't a React component.
export const getClasses = () => classes;

const idFor = (name) => classes.find((c) => c.name === name)?.id;
const fail = (e) => alert(e.message || "Something went wrong. Please try again.");

export async function addClass({ name, grade }) {
  try {
    await apiClient.post("/classes", { className: name, gradeRange: grade });
    await refreshClasses();
  } catch (e) {
    fail(e);
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
export async function removeClass(name) {
  const id = idFor(name);
  if (!id) return;
  try {
    await apiClient.patch(`/classes/${id}/deactivate`);
    await refreshClasses();
  } catch (e) {
    fail(e); // 409 if learners are still active in the class
  }
}

// How many learners are in a class (active or deactivated).
export function learnerCount(cls) {
  return typeof cls.learner_count === "number" ? cls.learner_count : 0;
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
  const { user } = useSession();
  useEffect(() => {
    if (["teacher", "manager"].includes(user?.role) && !loaded && !loading) refreshClasses();
  }, [user]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const useClassesLoading = () => useSyncExternalStore(subscribe, getLoading);
