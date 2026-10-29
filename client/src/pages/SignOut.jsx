import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { apiClient } from "../services/apiClient";
import { useSession } from "../services/session";
import { colourForClass } from "./AddClassSheet";
import { useClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";

// Digital sign-out. Loads today's collection list from GET /api/signout/today
// (learners marked present, their authorised pickups, who has already gone)
// and records collections with POST /api/signout/confirm, which re-checks
// everything server-side. Teachers and managers can both sign learners out.
//
// The collector is tapped from the learner's pickup list (the server checks
// by guardian id, not by name). A typed name that isn't on the list, or
// "Walking Home" for a learner without that permission, goes to the
// "Needs manager approval" screen.
//
// TODO: the manager approval queue and the manager override are not built
// yet. Both need a real escalation table and API; until then those screens
// record nothing.
function SignOut({ role = "Teacher" }) {
  const navigate = useNavigate();
  const isManager = role === "Manager";
  const { displayName, displayRole } = useHeader();
  const comingSoon = () => alert("Coming soon");
  // The list is the same width as Attendance and Learners; the steps after
  // tapping Sign Out are short forms, so they stay narrower.
  const listShell = "max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full";
  const formShell = "max-w-lg md:max-w-xl mx-auto w-full";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  // Class filter: a teacher opens on the class they lead (same rule as the
  // header), managers on All. `chosenClass` stays null until a filter is
  // tapped, so the default can follow the class list once it has loaded.
  const { user } = useSession();
  const classList = useClasses();
  const myClass = isManager ? null : classList.find((c) => c.teacher === user?.fullName);
  const [chosenClass, setSelectedClass] = useState(null);
  const selectedClass = chosenClass ?? myClass?.name ?? "All";
  const [selectedLearner, setSelectedLearner] = useState(null);
  // { guardianId, name }: guardianId null means walking home alone.
  const [collector, setCollector] = useState(null);
  const [otherName, setOtherName] = useState("");
  const [step, setStep] = useState("list");
  const [flagReason, setFlagReason] = useState("");
  const [flaggedName, setFlaggedName] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [signedOutAt, setSignedOutAt] = useState("");

  const loadToday = useCallback(async () => {
    try {
      const data = await apiClient.get("/signout/today");
      setLearners(data.learners);
      setLoadError("");
    } catch (e) {
      setLoadError(e.message || "Could not load today's list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const inClass = selectedClass === "All" ? learners : learners.filter((l) => l.className === selectedClass);
  const toCollect = inClass.filter((l) => !l.signedOut);
  const collected = inClass.filter((l) => l.signedOut);
  const filteredLearners = toCollect.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  const resetFlow = () => {
    setSelectedLearner(null);
    setCollector(null);
    setOtherName("");
    setFlagReason("");
    setFlaggedName("");
    setVerifyError("");
    setSaveError("");
    setStep("list");
  };

  // The name box and the pickup buttons work together (Figma): tapping a
  // pickup puts their name in the box, and typing a name that is on the list
  // selects that person. The server still checks by guardian id.
  const choose = (next) => {
    setCollector(next);
    setOtherName(next.guardianId === null ? "" : next.name);
    setVerifyError("");
  };

  const typeName = (value) => {
    setOtherName(value);
    setVerifyError("");
    const match = selectedLearner.pickups.find((p) => p.fullName.toLowerCase() === value.trim().toLowerCase());
    setCollector(match ? { guardianId: match.guardianId, name: match.fullName } : null);
  };

  const flag = (name, reason) => {
    setFlaggedName(name);
    setFlagReason(reason);
    setStep("flagged");
  };

  const tryVerify = () => {
    setVerifyError("");
    if (collector) {
      if (collector.guardianId === null && !selectedLearner.canWalkHomeAlone) {
        flag("Walking Home", "Walking home is not pre-authorised for this learner.");
        return;
      }
      setStep("confirmed");
      return;
    }
    const typed = otherName.trim();
    if (!typed) {
      setVerifyError("Choose someone from the list, or type the name of the person collecting.");
      return;
    }
    // A name on the list would already have selected that person (typeName).
    flag(typed, `${typed} is not on the authorised pickup list.`);
  };

  const handleConfirmSignOut = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const record = await apiClient.post("/signout/confirm", {
        learnerId: selectedLearner.learnerId,
        guardianId: collector.guardianId,
      });
      setSignedOutAt(String(record?.time_out ?? "").slice(0, 5));
      setStep("success");
      loadToday();
    } catch (e) {
      setSaveError(e.message || "Could not sign this learner out. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const collectorLabel = collector?.guardianId === null ? "Walking home alone" : collector?.name;

  const header = (
    <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
        <div>
          <p className="text-sm font-semibold text-orange-500">{displayName}</p>
          <p className="text-xs text-gray-500">{displayRole}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={comingSoon} className={iconBtn}>🔔</button>
        {isManager && (
          <button onClick={() => navigate("/settings")} className={iconBtn}>⚙️</button>
        )}
        <MoreMenu />
      </div>
    </div>
  );

  const page = (children, center = false) => (
    <div className="min-h-screen bg-cream flex flex-col">
      {header}
      <div className={`flex-1 px-4 pt-5 pb-32 ${center ? "flex flex-col items-center justify-center " : ""}${step === "list" ? listShell : formShell}`}>
        {children}
      </div>
    </div>
  );

  // Every step keeps the page title and today's count at the top (Figma).
  const pageTitle = (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-gray-900">
        Digital Sign-Out <span aria-hidden="true">🚪</span>
      </h1>
      {!loading && !loadError && (
        <p className="text-sm text-gray-500 mt-1">
          {step === "list" ? filteredLearners.length : toCollect.length} learners still to be collected
        </p>
      )}
    </div>
  );

  // Large rounded buttons used on the steps after tapping Sign Out.
  const primaryBtn =
    "w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold shadow-lg hover:bg-orange-600 active:scale-[0.98] transition disabled:opacity-60";
  const secondaryBtn =
    "py-3.5 rounded-2xl bg-stone-100 text-gray-600 font-semibold hover:bg-stone-200 active:scale-[0.98] transition";

  const errorBox = (text) => (
    <div role="alert" className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">
      {text}
    </div>
  );

  if (step === "list") {
    return page(
      <>
        {pageTitle}
        <input
          type="text"
          aria-label="Search learner name"
          placeholder="Search learner name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <div className="flex gap-2 mt-3 mb-5 overflow-x-auto py-2">
          {["All", ...classList.map((c) => c.name)].map((cls) => {
            const isActive = selectedClass === cls;
            const classColour = cls === "All" ? "#FB923C" : colourForClass(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                style={
                  isActive
                    ? { backgroundColor: classColour, borderColor: classColour, color: "#1f2937" }
                    : { backgroundColor: "#ffffff", borderColor: "#e5e7eb", color: "#4b5563" }
                }
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-md border transition active:scale-95"
              >
                {cls}
              </button>
            );
          })}
        </div>
        {loading && <p className="text-sm text-gray-400 text-center py-6">Loading today&apos;s list...</p>}
        {loadError && (
          <div className="text-center py-4">
            {errorBox(`Could not load today's list. ${loadError}`)}
            <button type="button" onClick={loadToday} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm shadow-md">
              Try again
            </button>
          </div>
        )}
        {!loading && !loadError && learners.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No learners have been marked present today. Take attendance first.
          </p>
        )}
        {!loading && !loadError && learners.length > 0 && inClass.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No one in {selectedClass} has been marked present today.
          </p>
        )}
        {!loading && !loadError && inClass.length > 0 && toCollect.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Everyone has been collected today.</p>
        )}
        {/* One learner per row, like the Attendance and Learners pages. */}
        <div className="space-y-3 mb-6">
          {filteredLearners.map((learner) => (
            <div key={learner.learnerId} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-xs text-gray-500">{learner.gradeRange} • {learner.className}</p>
                <p className="text-xs text-green-500 mt-1">Present today</p>
              </div>
              <button
                type="button"
                aria-label={`Sign out ${learner.name}`}
                onClick={() => {
                  setSelectedLearner(learner);
                  setStep("verify");
                }}
                className="shrink-0 px-4 py-1.5 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-lg hover:bg-orange-500 active:scale-95 transition"
              >
                Sign Out
              </button>
            </div>
          ))}
        </div>
        {collected.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-3 tracking-wide">ALREADY COLLECTED TODAY</p>
            <div className="space-y-2">
              {collected.map((item) => (
                <div key={item.learnerId} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg border border-gray-200">
                  <p className="text-sm text-gray-600">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.signedOut.timeOut} • {item.signedOut.collectedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </>,
    );
  }

  if (step === "verify") {
    // Soft grey buttons; the chosen one turns mint green with a tick (Figma).
    // Icons are aria-hidden so each button is announced by the person's name.
    const pickupButton = (key, icon, label, sub, next) => {
      const selected =
        collector && collector.guardianId === next.guardianId && collector.name === next.name;
      return (
        <button
          key={key}
          type="button"
          aria-pressed={Boolean(selected)}
          onClick={() => choose(next)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-semibold transition active:scale-[0.99] ${
            selected
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-transparent bg-stone-100 text-gray-600 hover:bg-stone-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true">{selected ? "✅" : icon}</span>
            {label}
          </span>
          {sub && <span className={`text-xs font-normal ${selected ? "text-emerald-600" : "text-gray-400"}`}>{sub}</span>}
        </button>
      );
    };
    const notOnList = otherName.trim() && !collector;

    return page(
      <>
        {pageTitle}

        <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 tracking-wide mb-1">SIGNING OUT</p>
          <p className="font-bold text-gray-900 text-lg">{selectedLearner.name}</p>
          <p className="text-sm text-gray-500">{selectedLearner.gradeRange} • {selectedLearner.className}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-5">
          <h2 className="font-bold text-gray-900">
            <span aria-hidden="true">🔍 </span>Verify Collector
          </h2>
          <label htmlFor="collector-name" className="text-xs text-gray-500 block mt-0.5 mb-3">
            Enter the name of the person collecting
          </label>
          <input
            id="collector-name"
            type="text"
            placeholder="Type their name, or tap someone below..."
            value={otherName}
            onChange={(e) => typeName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {notOnList && (
            <div className="mb-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-xl px-3 py-2">
              This person is not on the pickup list. Tap Verify to flag it for the manager.
            </div>
          )}

          <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2">AUTHORISED PICKUPS</p>
          <div className="space-y-2">
            {selectedLearner.pickups.length === 0 && (
              <p className="text-sm text-gray-500">No one is on this learner&apos;s pickup list yet. Ask the parent to add someone, or ask a manager to approve the sign-out.</p>
            )}
            {selectedLearner.pickups.map((p) =>
              pickupButton(p.guardianId, "👤", p.fullName, p.relationship, { guardianId: p.guardianId, name: p.fullName }),
            )}
            {pickupButton("walking-home", "🚶", "Walking Home", selectedLearner.canWalkHomeAlone ? "Allowed" : null, {
              guardianId: null,
              name: "Walking Home",
            })}
          </div>
          {verifyError && <div className="mt-3">{errorBox(verifyError)}</div>}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={resetFlow} className={`flex-1 ${secondaryBtn}`}>
            <span aria-hidden="true">← </span>Cancel
          </button>
          <button type="button" onClick={tryVerify} className={`flex-1 ${primaryBtn}`}>
            Verify<span aria-hidden="true"> ✓</span>
          </button>
        </div>
      </>,
    );
  }

  if (step === "flagged") {
    return page(
      <>
        {pageTitle}
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 mb-4 text-center shadow-lg">
          <p className="text-4xl" aria-hidden="true">⚠️</p>
          <p className="font-bold text-orange-700 text-lg mt-2">Needs manager approval</p>
          <p className="text-sm text-gray-600 mt-2">{flagReason}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-6 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">Learner</span><span className="font-medium">{selectedLearner.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Collector</span><span className="font-medium">{flaggedName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Staff member</span><span className="font-medium">{displayName}</span></div>
        </div>
        <button type="button" onClick={() => setStep("flaggedDone")} className={`${primaryBtn} mb-3`}>
          Send to manager queue
        </button>
        {isManager && (
          <>
            <button
              type="button"
              disabled
              className="w-full py-3 rounded-full bg-white text-gray-400 font-medium border border-gray-200 shadow-lg mb-1 cursor-not-allowed"
            >
              Override and approve
            </button>
            <p className="text-xs text-gray-400 text-center mb-3">Override isn&apos;t available yet: it needs the approval queue.</p>
          </>
        )}
        <button type="button" onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2">
          Go back
        </button>
      </>,
    );
  }

  if (step === "flaggedDone") {
    return page(
      <>
        {pageTitle}
        <div className="bg-white rounded-2xl p-6 text-center mb-5 w-full shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 text-lg">Sent to the manager queue</p>
          <p className="text-sm text-gray-600 mt-2">
            {selectedLearner.name} will not leave until a manager approves this collection.
          </p>
          <p className="text-xs text-orange-600 mt-3">
            Note: the manager queue isn&apos;t connected yet, so nothing has been sent or saved. Tell the manager in person.
          </p>
        </div>
        <button type="button" onClick={resetFlow} className={primaryBtn}>
          Back to list
        </button>
      </>,
    );
  }

  if (step === "confirmed") {
    // The time shown is now; the server records the actual time on confirm.
    const now = new Date().toLocaleTimeString("en-ZA", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Johannesburg",
    });
    const summaryRow = (label, value) => (
      <div className="flex justify-between gap-3 py-2.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900 text-right">{value}</span>
      </div>
    );

    return page(
      <>
        {pageTitle}

        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 mb-4 text-center shadow-lg">
          <p className="text-4xl" aria-hidden="true">✅</p>
          <p className="font-bold text-emerald-600 text-xl mt-2">Verified!</p>
          <p data-testid="verified-message" className="text-sm text-gray-700 mt-1">
            {collector.guardianId === null ? (
              <><strong>{selectedLearner.name}</strong> is allowed to walk home alone</>
            ) : (
              <><strong>{collector.name}</strong> is authorised to collect {selectedLearner.name}</>
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl px-4 pt-4 pb-2 shadow-lg border border-gray-200 mb-5 text-sm">
          <h2 className="font-bold text-gray-900 mb-1">Sign-Out Summary</h2>
          <div className="divide-y divide-gray-100">
            {summaryRow("Learner", selectedLearner.name)}
            {summaryRow("Collector", collectorLabel)}
            {summaryRow("Time", now)}
            {summaryRow(isManager ? "Manager" : "Teacher", displayName)}
          </div>
        </div>

        {saveError && errorBox(saveError)}
        <button type="button" onClick={handleConfirmSignOut} disabled={saving} className={`${primaryBtn} mb-3`}>
          {saving ? "Signing out..." : <>Confirm Sign-Out<span aria-hidden="true"> 🚪</span></>}
        </button>
        <button type="button" onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2">
          Go back
        </button>
      </>,
    );
  }

  if (step === "success") {
    return page(
      <>
        {pageTitle}

        <div className="bg-orange-50 rounded-2xl p-6 text-center mb-5 w-full">
          <p className="text-5xl" aria-hidden="true">⭐</p>
          <p className="font-bold text-orange-500 text-xl mt-3 mb-1">{selectedLearner.name.split(" ")[0]} is signed out!</p>
          <p className="text-sm text-gray-500">
            {collector.guardianId === null ? "Walking home alone" : `Collected by ${collector.name}`}
            {signedOutAt && ` at ${signedOutAt}`}
          </p>
        </div>
        <button type="button" onClick={resetFlow} className={primaryBtn}>
          Sign Out Another Learner
        </button>
      </>,
    );
  }

  return null;
}

export default SignOut;