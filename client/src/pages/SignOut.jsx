import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { apiClient } from "../services/apiClient";
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
  const shell = isManager ? "max-w-5xl mx-auto w-full" : "max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-5xl mx-auto w-full";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
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

  const toCollect = learners.filter((l) => !l.signedOut);
  const collected = learners.filter((l) => l.signedOut);
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

  const choose = (next) => {
    setCollector(next);
    setOtherName("");
    setVerifyError("");
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
    const onList = selectedLearner.pickups.find((p) => p.fullName.toLowerCase() === typed.toLowerCase());
    if (onList) {
      setVerifyError(`${onList.fullName} is on the pickup list. Tap their name above instead.`);
      return;
    }
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
      <div className={`flex-1 px-4 md:px-6 pt-5 pb-32 ${center ? "flex flex-col items-center justify-center " : ""}${shell}`}>
        {children}
      </div>
    </div>
  );

  const errorBox = (text) => (
    <div role="alert" className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">
      {text}
    </div>
  );

  if (step === "list") {
    return page(
      <>
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Digital Sign-Out</h1>
          {!loading && !loadError && (
            <p className="text-sm text-gray-500 mt-1">{filteredLearners.length} learners still to be collected</p>
          )}
        </div>
        <input
          type="text"
          aria-label="Search learner name"
          placeholder="Search learner name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-4 mb-5 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
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
        {!loading && !loadError && learners.length > 0 && toCollect.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Everyone has been collected today.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
          {filteredLearners.map((learner) => (
            <div key={learner.learnerId} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200">
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
                className="px-4 py-1.5 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-lg"
              >
                Sign Out
              </button>
            </div>
          ))}
        </div>
        {collected.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-3 tracking-wide">ALREADY COLLECTED TODAY</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {collected.map((item) => (
                <div key={item.learnerId} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200">
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
    const pickupButton = (key, label, sub, next) => {
      const selected =
        collector && collector.guardianId === next.guardianId && collector.name === next.name;
      return (
        <button
          key={key}
          type="button"
          aria-pressed={Boolean(selected)}
          onClick={() => choose(next)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left shadow-md ${
            selected ? "border-cyan-400 bg-cyan-50" : "border-gray-200 bg-white"
          }`}
        >
          <span>{label}</span>
          {sub && <span className="text-xs text-gray-500">{sub}</span>}
        </button>
      );
    };

    return page(
      <>
        <div className="bg-orange-50 rounded-2xl p-4 mb-5 shadow-lg border border-orange-200">
          <p className="text-xs text-gray-500 mb-1">SIGNING OUT</p>
          <p className="font-bold text-gray-900 text-lg">{selectedLearner.name}</p>
          <p className="text-sm text-gray-600">{selectedLearner.gradeRange} • {selectedLearner.className}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Who is collecting?</h2>

          <p className="text-xs font-medium text-gray-500 mb-2">AUTHORISED PICKUPS</p>
          <div className="space-y-2 mb-4">
            {selectedLearner.pickups.length === 0 && (
              <p className="text-sm text-gray-500">No-one is on this learner&apos;s pickup list yet. Ask the manager to add someone.</p>
            )}
            {selectedLearner.pickups.map((p) =>
              pickupButton(p.guardianId, p.fullName, p.relationship, { guardianId: p.guardianId, name: p.fullName }),
            )}
            {pickupButton("walking-home", "Walking Home", selectedLearner.canWalkHomeAlone ? "Allowed" : null, {
              guardianId: null,
              name: "Walking Home",
            })}
          </div>

          <label htmlFor="other-collector" className="text-xs font-medium text-gray-500 mb-2 block">
            SOMEONE NOT ON THE LIST?
          </label>
          <input
            id="other-collector"
            type="text"
            placeholder="Type their name..."
            value={otherName}
            onChange={(e) => {
              setOtherName(e.target.value);
              setCollector(null);
              setVerifyError("");
            }}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {otherName.trim() && (
            <div className="mb-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-xl px-3 py-2">
              This person is not on the pickup list. Tap Verify to flag it for the manager.
            </div>
          )}
          {verifyError && errorBox(verifyError)}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={resetFlow} className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-lg">
            Cancel
          </button>
          <button type="button" onClick={tryVerify} className="flex-1 py-3 rounded-full bg-orange-400 text-white font-semibold shadow-lg">
            Verify
          </button>
        </div>
      </>,
    );
  }

  if (step === "flagged") {
    return page(
      <>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5 text-center shadow-lg">
          <p className="font-bold text-orange-700 text-lg">Needs manager approval</p>
          <p className="text-sm text-gray-600 mt-2">{flagReason}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-6 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">Learner</span><span className="font-medium">{selectedLearner.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Collector</span><span className="font-medium">{flaggedName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Staff member</span><span className="font-medium">{displayName}</span></div>
        </div>
        <button type="button" onClick={() => setStep("flaggedDone")} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg mb-3">
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
        <button type="button" onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-500">
          Go back
        </button>
      </>,
    );
  }

  if (step === "flaggedDone") {
    return page(
      <>
        <div className="bg-white rounded-2xl p-6 text-center mb-8 w-full shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 text-lg">Sent to the manager queue</p>
          <p className="text-sm text-gray-600 mt-2">
            {selectedLearner.name} will not leave until a manager approves this collection.
          </p>
          <p className="text-xs text-orange-600 mt-3">
            Note: the manager queue isn&apos;t connected yet, so nothing has been sent or saved. Tell the manager in person.
          </p>
        </div>
        <button type="button" onClick={resetFlow} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg">
          Back to list
        </button>
      </>,
      true,
    );
  }

  if (step === "confirmed") {
    return page(
      <>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 text-center shadow-lg">
          <p className="font-bold text-green-700 text-lg">Verified</p>
          <p className="text-sm text-gray-600 mt-1">
            {collector.guardianId === null
              ? `${selectedLearner.name} is allowed to walk home alone`
              : `${collector.name} is authorised to collect ${selectedLearner.name}`}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Learner</span><span className="font-medium">{selectedLearner.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Collector</span><span className="font-medium">{collectorLabel}</span></div>
        </div>
        {saveError && errorBox(saveError)}
        <button
          type="button"
          onClick={handleConfirmSignOut}
          disabled={saving}
          className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg mb-3 disabled:opacity-60"
        >
          {saving ? "Signing out..." : "Confirm Sign-Out"}
        </button>
        <button type="button" onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-500">
          Go back
        </button>
      </>,
    );
  }

  if (step === "success") {
    return page(
      <>
        <div className="bg-orange-50 rounded-2xl p-6 text-center mb-8 w-full shadow-lg border border-orange-200">
          <p className="font-bold text-orange-600 text-xl mb-1">{selectedLearner.name.split(" ")[0]} is signed out</p>
          <p className="text-sm text-gray-600">
            {collector.guardianId === null ? "Walking home alone" : `Collected by ${collector.name}`}
            {signedOutAt && ` at ${signedOutAt}`}
          </p>
        </div>
        <button type="button" onClick={resetFlow} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg">
          Sign Out Another Learner
        </button>
      </>,
      true,
    );
  }

  return null;
}

export default SignOut;