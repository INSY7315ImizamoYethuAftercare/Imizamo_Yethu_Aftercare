import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/apiClient";
import { useSession } from "../services/session";
import { categoryChipClass } from "../utils/categories";

// Parent/guardian home. Data comes from:
//   GET  /api/guardian/children                         - this parent's children
//   GET  /api/guardian/children/:id/overview            - everything on this page
//   POST /api/guardian/children/:id/pickups             - add an authorised pickup
// The server only ever returns the parent's own children.

const card = "bg-white rounded-2xl shadow-lg border border-gray-100";
const EMPTY_PICKUP = { fullName: "", relationship: "", contactNumber: "", canWalkHomeAlone: false };

function StatusBanner({ child, today }) {
  const first = child.firstName;
  let tone = "border-green-400 bg-green-50";
  let title = `${first} hasn't been marked present yet today`;
  let detail = "You'll see here when they arrive and when they're collected.";

  if (today.signedOut) {
    title = `👋 ${first} has been collected`;
    detail =
      today.signedOut.collectedBy === "Walked home alone"
        ? `Walked home alone at ${today.signedOut.timeOut}`
        : `Signed out by ${today.signedOut.collectedBy} at ${today.signedOut.timeOut}`;
  } else if (today.status === "present") {
    title = `✅ ${first} is at aftercare today`;
    detail = today.timeIn ? `Arrived at ${today.timeIn}` : "Marked present";
  } else if (today.status === "absent") {
    tone = "border-red-300 bg-red-50";
    title = `${first} was marked absent today`;
    detail = "Contact the teacher if this isn't right.";
  } else {
    tone = "border-gray-200 bg-gray-50";
  }

  return (
    <div className={`rounded-2xl border-2 px-4 py-3 mb-6 ${tone}`}>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-0.5">{detail}</p>
    </div>
  );
}

function AddPickupSheet({ child, onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY_PICKUP);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const ready = form.fullName.trim() && form.relationship.trim() && form.contactNumber.trim();
  const input = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300";
  const label = "text-xs font-medium text-gray-500 mb-1 block tracking-wide";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError("");
    try {
      const pickup = await apiClient.post(`/guardian/children/${child.learnerId}/pickups`, {
        fullName: form.fullName.trim(),
        relationship: form.relationship.trim(),
        contactNumber: form.contactNumber.trim(),
        canWalkHomeAlone: form.canWalkHomeAlone,
      });
      onAdded(pickup);
    } catch (err) {
      setError(err.message || "Could not add this person. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-pickup-title"
        onSubmit={submit}
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-6 pt-3 pb-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1.5 bg-orange-100 rounded-full mx-auto mb-5" />
        <h2 id="add-pickup-title" className="text-xl font-bold text-gray-900">Add Authorised Pickup</h2>
        <p className="text-sm text-gray-400 mt-1 mb-5">
          This person will be allowed to collect {child.firstName}. The hub may request ID verification.
        </p>

        <div className="space-y-4 mb-5">
          <div>
            <label htmlFor="pickup-name" className={label}>FULL NAME *</label>
            <input id="pickup-name" value={form.fullName} onChange={set("fullName")} placeholder="e.g. Zainab Hendricks" className={input} />
          </div>
          <div>
            <label htmlFor="pickup-relationship" className={label}>RELATIONSHIP TO CHILD *</label>
            <input id="pickup-relationship" value={form.relationship} onChange={set("relationship")} placeholder="e.g. Aunt, Grandparent, Neighbour" className={input} />
          </div>
          <div>
            <label htmlFor="pickup-contact" className={label}>CONTACT NUMBER *</label>
            <input id="pickup-contact" type="tel" value={form.contactNumber} onChange={set("contactNumber")} placeholder="e.g. 072 345 6789" className={input} />
          </div>
          {!child.canWalkHomeAlone && (
            <label htmlFor="pickup-walk" className="flex items-start gap-3 bg-orange-50/60 border border-orange-100 rounded-2xl px-4 py-3 cursor-pointer">
              <input
                id="pickup-walk"
                type="checkbox"
                checked={form.canWalkHomeAlone}
                onChange={(e) => setForm((f) => ({ ...f, canWalkHomeAlone: e.target.checked }))}
                className="mt-1 w-5 h-5 accent-orange-400"
              />
              <span>
                <span className="block font-semibold text-gray-900">{child.firstName} may walk home alone</span>
                <span className="block text-xs text-gray-400">I give permission for my child to leave the hub unaccompanied</span>
              </span>
            </label>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-beige text-gray-500 font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!ready || saving}
            className="flex-1 py-3 rounded-2xl bg-orange-400 text-white font-semibold disabled:bg-gray-200 disabled:text-gray-400"
          >
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ParentHome() {
  const navigate = useNavigate();
  const { user } = useSession();
  const comingSoon = () => alert("Coming soon");

  const [children, setChildren] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    apiClient
      .get("/guardian/children")
      .then((list) => {
        setChildren(list);
        if (list.length) setSelectedId(list[0].learner_id);
      })
      .catch((e) => setError(e.message || "Could not load your children."));
  }, []);

  const loadOverview = useCallback(async (id) => {
    try {
      setData(await apiClient.get(`/guardian/children/${id}/overview`));
      setError("");
    } catch (e) {
      setError(e.message || "Could not load this child's information.");
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadOverview(selectedId);
  }, [selectedId, loadOverview]);

  const firstName = (user?.fullName ?? "").split(" ")[0];
  const header = (
    <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
        <div>
          <p className="text-sm font-semibold text-orange-500">{user?.fullName}</p>
          <p className="text-xs text-gray-500">Parent</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Notifications" onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-50 shadow-sm">🔔</button>
        <button type="button" aria-label="Settings" onClick={() => navigate("/parent/settings")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm">⚙️</button>
      </div>
    </div>
  );

  const shell = (body) => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {header}
      <div className="flex-1 px-4 md:px-6 pt-5 pb-32 max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">{body}</div>
    </div>
  );

  if (error) return shell(<p role="alert" className="text-sm text-red-500 text-center py-6">{error}</p>);
  if (children && children.length === 0) {
    return shell(
      <p className="text-sm text-gray-500 text-center py-6">
        Your account isn't linked to a learner yet. Please contact the hub.
      </p>,
    );
  }
  if (!data) return shell(<p className="text-sm text-gray-400 text-center py-6">Loading...</p>);

  const { child, today, attendance, week, pickups, teacher, observations } = data;
  const shownObservations = showAll ? observations : observations.slice(0, 1);
  const todayLabel =
    today.status === "present" ? "Present ✓" : today.status === "absent" ? "Absent" : "Not marked";
  const todayColour =
    today.status === "present" ? "text-green-600" : today.status === "absent" ? "text-red-500" : "text-gray-400";

  return shell(
    <>
      {children.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto" role="tablist" aria-label="Your children">
          {children.map((c) => (
            <button
              key={c.learner_id}
              type="button"
              role="tab"
              aria-selected={c.learner_id === selectedId}
              onClick={() => {
                setShowAll(false);
                setSelectedId(c.learner_id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm border ${
                c.learner_id === selectedId ? "bg-orange-400 text-white border-orange-400" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {c.first_name}
            </button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
        <span aria-hidden="true" className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/15" />
        <span aria-hidden="true" className="absolute -bottom-12 right-20 w-28 h-28 rounded-full bg-white/10" />
        <h1 className="relative text-xl md:text-2xl font-bold">Welcome, {firstName}! 💛</h1>
        <p className="relative text-sm mt-1 opacity-90">Here&apos;s how {child.firstName} is doing</p>
      </div>

      {banner && (
        <div role="status" className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center">
          {banner}
        </div>
      )}

      <div className={`${card} p-5 mb-5`}>
        <h2 className="text-xl font-bold text-gray-900">{child.name}</h2>
        <p className="text-gray-400 mt-0.5">{child.gradeRange} · {child.className}</p>
        <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-3 text-center">
          <div>
            <p className="text-xl font-bold text-green-600">{attendance.percent === null ? "—" : `${attendance.percent}%`}</p>
            <p className="text-xs text-gray-400 mt-1">Attendance</p>
          </div>
          <div>
            <p className={`text-xl font-bold ${todayColour}`}>{todayLabel}</p>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-500">{observations.length}</p>
            <p className="text-xs text-gray-400 mt-1">Updates</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-300 text-center mt-3">Attendance over the last {attendance.periodDays} days</p>
      </div>

      <StatusBanner child={child} today={today} />

      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-bold text-gray-900">Teacher Observations</h2>
          <p className="text-xs text-gray-400">{observations.length} {observations.length === 1 ? "update" : "updates"} recorded</p>
        </div>
        {observations.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-orange-500 border border-gray-200 shadow-lg hover:border-orange-300 active:scale-95 transition"
          >
            {showAll ? "Show latest ↑" : `View all ${observations.length} ↓`}
          </button>
        )}
      </div>
      {observations.length === 0 && (
        <p className={`${card} p-4 text-sm text-gray-400 mb-6`}>No observations yet. Teachers' updates will appear here.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {shownObservations.map((o, i) => (
          <div key={o.observationId} className={`${card} p-4`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryChipClass(o.category)}`}>{o.category}</span>
              <span className="text-sm text-gray-400">{o.date}</span>
              {i === 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-orange-50 text-orange-400 text-xs font-medium">Latest</span>}
            </div>
            {o.notes && <p className="text-gray-700">{o.notes}</p>}
            {o.teacherName && <p className="text-sm text-gray-400 mt-2">— {o.teacherName}</p>}
          </div>
        ))}
      </div>
      {!showAll && observations.length > 1 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full py-3 rounded-2xl bg-white text-orange-500 font-semibold border border-gray-200 shadow-lg hover:border-orange-300 active:scale-[0.98] transition mb-6"
        >
          + {observations.length - 1} more {observations.length - 1 === 1 ? "observation" : "observations"} →
        </button>
      )}

      <div className="flex items-center justify-between mt-3 mb-3">
        <h2 className="font-bold text-gray-900">Authorised Pickups</h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-md hover:bg-orange-500 active:scale-95 transition"
        >
          + Add Person
        </button>
      </div>
      <div className={`${card} divide-y divide-gray-100 mb-6 md:divide-y-0 md:grid md:grid-cols-2 md:gap-0`}>
        {pickups.map((p) => (
          <div key={p.guardianId} className="flex items-center gap-3 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0">
            <span aria-hidden="true" className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">👤</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{p.fullName}{p.isYou && <span className="text-gray-400 font-normal"> (you)</span>}</p>
              <p className="text-xs text-gray-400">{p.relationship}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold">✓ Authorised</span>
          </div>
        ))}
        {child.canWalkHomeAlone && (
          <div className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden="true" className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">🚶</span>
            <p className="flex-1 font-medium text-gray-900">May walk home alone</p>
            <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold">✓ Allowed</span>
          </div>
        )}
      </div>

      <h2 className="font-bold text-gray-900 mb-3">This Week</h2>
      <div className={`${card} divide-y divide-gray-100 mb-6 md:divide-y-0 md:grid md:grid-cols-2`}>
        {week.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No attendance recorded in the last 7 days.</p>}
        {week.map((d) => (
          <div key={d.date} className="flex items-center gap-3 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0">
            <span aria-hidden="true" className="text-xl">{d.status === "present" ? "✅" : "❌"}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{d.date}</p>
              {d.signedOut && (
                <p className="text-xs text-gray-400">
                  {d.signedOut.collectedBy === "Walked home alone" ? "Walked home alone" : `Collected by ${d.signedOut.collectedBy}`} · {d.signedOut.timeOut}
                </p>
              )}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                d.status === "present" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              }`}
            >
              {d.status === "present" ? "Present" : "Absent"}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-orange-300 bg-cream px-4 py-4">
        <p className="font-semibold text-orange-500 mb-1">📞 Need to get in touch?</p>
        {teacher ? (
          <p className="text-sm text-gray-700">
            Teacher: {teacher.name} · <a href={`mailto:${teacher.email}`} className="underline">{teacher.email}</a>
          </p>
        ) : (
          <p className="text-sm text-gray-700">No teacher is assigned to the {child.className} class yet. Please contact the hub.</p>
        )}
      </div>

      {adding && (
        <AddPickupSheet
          child={child}
          onClose={() => setAdding(false)}
          onAdded={(pickup) => {
            setAdding(false);
            setBanner(`${pickup.fullName} can now collect ${child.firstName}.`);
            setTimeout(() => setBanner(""), 3000);
            loadOverview(child.learnerId);
          }}
        />
      )}
    </>,
  );
}

export default ParentHome;