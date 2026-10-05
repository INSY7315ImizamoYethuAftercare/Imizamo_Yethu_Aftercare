import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { apiClient } from "../services/apiClient";
import { dataBus } from "../services/dataBus";
import { useSession } from "../services/session";
import { greeting, longDate, todayInSA } from "../utils/dates";
import { useClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";
import { useLearners } from "./UseLearners";

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
    "bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex flex-col items-center gap-2 hover:shadow-xl hover:border-orange-300 active:scale-[0.97] transition";

  const classes = useClasses();
  const learners = useLearners();
  // The class this teacher leads (same rule as the header's "Teacher • Yellow").
  const myClass = classes.find((c) => c.teacher === user?.fullName) ?? null;
  const classLearners = myClass ? learners.filter((l) => l.classId === myClass.id && l.status === "active") : [];

  const [statuses, setStatuses] = useState({}); // learnerId -> "present" | "absent"
  const [signOuts, setSignOuts] = useState([]); // today's sign-outs in this class
  const [loadError, setLoadError] = useState("");

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

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
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
          <MoreMenu />
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-lg mx-auto w-full">
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <p className="text-sm opacity-90">{longDate(todayInSA())}</p>
          <h1 className="text-xl font-bold mt-1">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm mt-1 opacity-90">
            {myClass
              ? `${myClass.name} class • ${present} of ${classLearners.length} present`
              : "You're not assigned to a class yet"}
          </p>
        </div>

        {loadError && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{loadError}</div>
        )}

        {myClass && (
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className={`${card} text-center`}>
              <p className="text-2xl font-bold text-green-500">{present}</p>
              <p className="text-[11px] text-gray-500 mt-1">Present</p>
            </div>
            <div className={`${card} text-center`}>
              <p className="text-2xl font-bold text-red-500">{absent}</p>
              <p className="text-[11px] text-gray-500 mt-1">Absent</p>
            </div>
            <div className={`${card} text-center`}>
              <p className="text-2xl font-bold text-orange-500">{signOuts.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Signed out</p>
            </div>
          </div>
        )}
        {myClass && (
          <p className="text-xs text-gray-500 mb-6 text-center">
            {classLearners.length} learner{classLearners.length === 1 ? "" : "s"} in your class
            {notMarked > 0 ? ` • ${notMarked} not marked yet` : ""}
          </p>
        )}

        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => navigate("/attendance")} className={action}>
            <span className="text-2xl text-green-500">✓</span>
            <span className="text-sm font-semibold text-gray-800">Attendance</span>
          </button>
          <button onClick={() => navigate("/learners")} className={action}>
            <span className="text-2xl">🎒</span>
            <span className="text-sm font-semibold text-gray-800">Learners</span>
          </button>
          <button onClick={() => navigate("/classes")} className={action}>
            <span className="text-2xl">🏫</span>
            <span className="text-sm font-semibold text-gray-800">Classes</span>
          </button>
          <button onClick={() => navigate("/signout")} className={action}>
            <span className="text-2xl">🚪</span>
            <span className="text-sm font-semibold text-gray-800">Sign-Out</span>
          </button>
        </div>

        {myClass && (
          <>
            <h2 className="font-semibold text-gray-900 mb-3">Today in {myClass.name} class</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 divide-y divide-gray-100">
              {signOuts.map((s) => (
                <div key={s.learnerId} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name} signed out</p>
                    <p className="text-xs text-gray-500">
                      {s.collectedBy === "Walked home alone" ? "Walked home alone" : `Collected by ${s.collectedBy}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{s.timeOut}</span>
                </div>
              ))}
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">Attendance</p>
                <p className="text-xs text-gray-500">
                  {notMarked === 0 && classLearners.length > 0
                    ? `Complete: ${present} present, ${absent} absent`
                    : `${present + absent} of ${classLearners.length} marked`}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
