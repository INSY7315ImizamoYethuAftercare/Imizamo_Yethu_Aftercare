import { useEffect, useMemo, useSyncExternalStore } from "react";
import { apiClient } from "../services/apiClient";
import { getSessionRole, onSessionReset, useSession } from "../services/session";

// Shared store for staff so the Staff page and the class assignment sheet
// agree (suspending a teacher removes them from the picker).
//
// Teachers come from GET /api/teacher (manager-only). `id` is
// teachers.teacher_id. "Suspended" = users.is_active = false. The signed-in
// manager is added to the list on the client, since the API has no manager list.
export const NO_TEACHER = "Unassigned";

let teachers = [];
let loaded = false;
let loading = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => teachers;
const getLoading = () => loading;

const toTeacher = (t) => ({
  id: t.teacher_id,
  name: t.full_name,
  email: t.contact_email,
  role: "Teacher",
  status: t.is_active ? "Active" : "Suspended",
});

export async function refreshStaff() {
  if (getSessionRole() !== "manager") return; // the endpoint is manager-only
  loading = true;
  emit();
  try {
    teachers = (await apiClient.get("/teacher")).map(toTeacher);
    loaded = true;
  } catch (e) {
    console.error("Could not load staff:", e);
  } finally {
    loading = false;
    emit();
  }
}

onSessionReset(() => {
  teachers = [];
  loaded = false;
  emit();
});

// Current snapshot, for other stores (e.g. looking up a teacher's id by name).
export const getStaff = () => teachers;

export async function setStaffStatus(id, status) {
  const action = status === "Active" ? "activate" : "deactivate";
  try {
    await apiClient.patch(`/teacher/${id}/${action}`);
    teachers = teachers.map((s) => (s.id === id ? { ...s, status } : s));
    emit();
  } catch (e) {
    alert(e.message || "Could not update this staff member.");
  }
}

export function useStaff() {
  const base = useSyncExternalStore(subscribe, getSnapshot);
  const { user } = useSession();
  useEffect(() => {
    if (user?.role === "manager" && !loaded && !loading) refreshStaff();
  }, [user]);
  return useMemo(
    () =>
      user?.role === "manager"
        ? [...base, { id: `manager-${user.userId}`, name: user.fullName, role: "Manager", status: "Active" }]
        : base,
    [base, user],
  );
}

export const useStaffLoading = () => useSyncExternalStore(subscribe, getLoading);

// Teachers only (no managers), for the class assignment picker.
export const teachersOnly = (list) => list.filter((s) => s.role === "Teacher");
