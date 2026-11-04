import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsButton from "../components/SettingsButton";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { useSession } from "../services/session";
import { greeting, longDate, todayInSA } from "../utils/dates";
import { getClasses, refreshClasses, useClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { refreshLearners, useLearners } from "./UseLearners";

// Teacher home: today's numbers for the class this teacher leads. The class
// and its learners come from the shared stores (reloaded whenever a page
// opens, so a learner the manager adds or moves shows up here); the day's
// attendance and sign-outs are loaded here.
function Home() {
  const { displayName, displayRole } = useHeader();
  const { user } = useSession();
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const action =
    "bg-white rounded-2xl p-3 shadow-lg border border-gray-200 flex items-center gap-3 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition";

  const classes = useClasses();
  const learners = useLearners();
  // The class this teacher leads (same rule as the header's "Teacher • Yellow").
  const myClass = classes.find((c) => c.teacher === user?.fullName) ?? null;
  const classLearners = myClass ? learners.filter((l) => l.classId === myClass.id && l.status === "active") : [];

  const [statuses, setStatuses] = useState({}); // learnerId -> "present" | "absent"
  const [signOuts, setSignOuts] = useState([]); // today's sign-outs in this class
  const [loadError, setLoadError] = useState("");
  // Until the class list and today's attendance have arrived, the page shows
  // "–" rather than 0s (a teacher seeing "0 present" could panic).
  const [storesReady, setStoresReady] = useState(() => getClasses().length > 0);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    // These share any request already running, so no extra API calls.
    Promise.all([refreshClasses(), refreshLearners()]).then(() => live && setStoresReady(true));
    return () => { live = false; };
  }, []);

  const load = useCallback(async () => {
    if (!myClass) return;
    try {
      const [records, day] = await Promise.all([
        apiClient.get(`/attendance/class/${myClass.id}`),
        apiClient.get("/signout/today"),
      ]);
      setStatuses(Object.fromEntries(records.map((r) => [r.learner_id, r.status])));
      setSignOuts(
        day.learners
          .filter((l) => l.className === myClass.name && l.signedOut)
          .map((l) => ({ learnerId: l.learnerId, name: l.name, ...l.signedOut }))
          .sort((a, b) => b.timeOut.localeCompare(a.timeOut)),
      );
      setLoadError("");
      setAttendanceLoaded(true);
    } catch (e) {
      setLoadError(e?.message || "Couldn't load today's attendance.");
    }
  }, [myClass?.id, myClass?.name]);

  // Load now, when the teacher comes back to the tab, and after attendance is saved.
  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    const off = dataBus.on("classes", load);
    return () => {
      window.removeEventListener("focus", load);
      off?.();
    };
  }, [load]);

  const present = classLearners.filter((l) => statuses[l.id] === "present").length;
  const absent = classLearners.filter((l) => statuses[l.id] === "absent").length;
  const notMarked = classLearners.length - present - absent;
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const total = classLearners.length;
  const pct = (n, of) => (of > 0 ? Math.round((n / of) * 100) : 0);
  const ready = storesReady && (!myClass || attendanceLoaded);
  // Came in today and not collected yet: who the teacher is still looking after.
  const stillHere = Math.max(present - signOuts.length, 0);
  const allCollected = present > 0 && stillHere === 0;

  // Stat cards in the Figma style: tinted icon, coloured number, progress bar.
  const stats = [
    { label: "Present", icon: "✅", value: present, bar: pct(present, total), tint: "bg-green-50", text: "text-green-600", fill: "bg-green-500" },
    { label: "Absent", icon: "❌", value: absent, bar: pct(absent, total), tint: "bg-red-50", text: "text-red-500", fill: "bg-red-500" },
    // Signed out as a share of who came in today.
    { label: "Signed out", icon: "🚪", value: signOuts.length, bar: pct(signOuts.length, present), tint: "bg-purple-50", text: "text-purple-600", fill: "bg-purple-500" },
    // Turns green at 0 once everyone who came in has gone home.
    allCollected
      ? { label: "Still here", icon: "🏠", value: 0, bar: 0, tint: "bg-green-50", text: "text-green-600", fill: "bg-green-500" }
      : { label: "Still here", icon: "🙋", value: stillHere, bar: pct(stillHere, present), tint: "bg-sky-50", text: "text-sky-600", fill: "bg-sky-500" },
  ];

  // Nudge to take (or finish) the register, until every learner is marked.
  const showReminder = ready && myClass && total > 0 && notMarked > 0;

  const actions = [
    { label: "Mark Attendance", icon: "✅", tint: "bg-green-50", to: "/attendance" },
    { label: "View Learners", icon: "🎒", tint: "bg-pink-50", to: "/learners" },
    { label: "View Classes", icon: "🏫", tint: "bg-sky-50", to: "/classes" },
    { label: "Sign-Out", icon: "🚪", tint: "bg-orange-50", to: "/signout" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Imizamo Yethu Learning Hub" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">{displayName}</p>
            <p className="text-xs text-gray-500">{displayRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <SettingsButton />
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full">
        {/* Welcome banner with the Figma's soft decorative circles. */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <span aria-hidden="true" className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/15" />
          <span aria-hidden="true" className="absolute -bottom-12 right-20 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm opacity-90">{longDate(todayInSA())}</p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">{greeting()}, {firstName}! 👋</h1>
            <p className="text-sm mt-1 opacity-90">
              {!storesReady
                ? "Loading your class…"
                : !myClass
                  ? "You're not assigned to a class yet"
                  : ready
                    ? `${myClass.name} class • ${present} of ${classLearners.length} present`
                    : `${myClass.name} class`}
            </p>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{loadError}</div>
        )}

        {showReminder && (
          <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-xl" aria-hidden="true">📝</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">
                {present + absent === 0 ? "Attendance not taken yet" : "Attendance not finished"}
              </p>
              <p className="text-xs text-gray-600">
                {notMarked} learner{notMarked === 1 ? "" : "s"} still to mark
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/attendance")}
              className="shrink-0 px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-md hover:bg-orange-500 active:scale-95 transition"
            >
              Mark now
            </button>
          </div>
        )}

        {myClass && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {stats.map((s) => (
              <div key={s.label} data-stat={s.label} className={card}>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${s.tint}`} aria-hidden="true">
                  {s.icon}
                </span>
                <p className={`text-2xl font-bold mt-3 ${ready ? s.text : "text-gray-300"}`}>{ready ? s.value : "–"}</p>
                <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${s.fill}`} style={{ width: `${ready ? s.bar : 0}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {myClass && (
          <p className="text-xs text-gray-500 mb-6">
            {classLearners.length} learner{classLearners.length === 1 ? "" : "s"} in your class
            {ready && notMarked > 0 ? ` • ${notMarked} not marked yet` : ""}
          </p>
        )}

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {actions.map((a) => (
            <button key={a.to} onClick={() => navigate(a.to)} className={action}>
              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl ${a.tint}`} aria-hidden="true">
                {a.icon}
              </span>
              <span className="text-sm font-semibold text-gray-800 text-left leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {myClass && (
          <>
            <h2 className="font-semibold text-gray-900 mb-3">Today in {myClass.name} class</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 divide-y divide-gray-100">
              {signOuts.map((s) => (
                <div key={s.learnerId} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 flex items-center justify-center" aria-hidden="true">🚪</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{s.name} signed out</p>
                    <p className="text-xs text-gray-500">
                      {s.collectedBy === "Walked home alone" ? "Walked home alone" : `Collected by ${s.collectedBy}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{s.timeOut}</span>
                </div>
              ))}
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-green-50 flex items-center justify-center" aria-hidden="true">
                  {ready && notMarked === 0 && classLearners.length > 0 ? "✅" : "📝"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Attendance</p>
                  <p className="text-xs text-gray-500">
                    {!ready
                      ? "Loading…"
                      : notMarked === 0 && classLearners.length > 0
                        ? `Complete: ${present} present, ${absent} absent`
                        : `${present + absent} of ${classLearners.length} marked`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
