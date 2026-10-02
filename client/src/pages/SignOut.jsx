import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { useHeader } from "./UseHeader";

function SignOut({ role = "Teacher" }) {
  const navigate = useNavigate();
  const isManager = role === "Manager";
  const { displayName, displayRole } = useHeader();
  const comingSoon = () => alert("Coming soon");
  const shell = isManager ? "max-w-5xl mx-auto w-full" : "max-w-lg mx-auto w-full";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const [learners, setLearners] = useState([
    { id: 1, name: "Aisha Petersen", grade: "Grade 2", group: "Yellow", status: "Present today" },
    { id: 2, name: "Liam van der Berg", grade: "Grade 4", group: "Green", status: "Present today" },
    { id: 3, name: "Zoe Ntombela", grade: "Grade 6", group: "Red", status: "Present today" },
    { id: 4, name: "Keanu Abrahams", grade: "Grade 3", group: "Green", status: "Present today" },
    { id: 5, name: "Amara Okoye", grade: "Grade 1", group: "Yellow", status: "Present today" },
  ]);

  const [collected, setCollected] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [collectorName, setCollectorName] = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [step, setStep] = useState("list");
  const [flagReason, setFlagReason] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const authorisedPickups = [
    { id: 1, name: "Fatima Petersen" },
    { id: 2, name: "Ahmed Petersen" },
    { id: 3, name: "Zainab Hendricks" },
  ];

  const isAuthorised = (name) =>
    authorisedPickups.some((p) => p.name.toLowerCase() === name.trim().toLowerCase());

  const isWalkingHome = (name) => name.trim().toLowerCase() === "walking home";

  const nameNeedsFlag = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    return isWalkingHome(trimmed) || !isAuthorised(trimmed);
  };

  const filteredLearners = learners.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetFlow = () => {
    setSelectedLearner(null);
    setCollectorName("");
    setSelectedPickup(null);
    setFlagReason("");
    setVerifyError("");
    setStep("list");
  };

  const handleConfirmSignOut = () => {
    setCollected([
      ...collected,
      {
        ...selectedLearner,
        collectedBy: collectorName,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setLearners(learners.filter((l) => l.id !== selectedLearner.id));
    setStep("success");
  };

  const tryVerify = () => {
    const name = collectorName.trim();
    if (!name) {
      setVerifyError("Type a collector name or choose someone from the list.");
      return;
    }
    setVerifyError("");
    if (isWalkingHome(name)) {
      setFlagReason("Walking home is not pre-authorised for this learner.");
      setStep("flagged");
      return;
    }
    if (!isAuthorised(name)) {
      setFlagReason(name + " is not on the authorised pickup list.");
      setStep("flagged");
      return;
    }
    setStep("confirmed");
  };

  const Header = () => (
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

  if (step === "list") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <Header />
        <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
          <div className="mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Digital Sign-Out</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredLearners.length} learners still to be collected</p>
          </div>
          <input
            type="text"
            placeholder="Search learner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mt-4 mb-5 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <div className="space-y-3 mb-6">
            {filteredLearners.map((learner) => (
              <div key={learner.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
                  <p className="text-xs text-green-500 mt-1">Present today</p>
                </div>
                <button
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
              <div className="space-y-2">
                {collected.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200">
                    <p className="text-sm text-gray-600">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <Header />
        <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
          <div className="bg-orange-50 rounded-2xl p-4 mb-5 shadow-lg border border-orange-200">
            <p className="text-xs text-gray-500 mb-1">SIGNING OUT</p>
            <p className="font-bold text-gray-900 text-lg">{selectedLearner.name}</p>
            <p className="text-sm text-gray-600">{selectedLearner.grade} • {selectedLearner.group}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Verify Collector</h2>
            <input
              type="text"
              placeholder="Type collector name..."
              value={collectorName}
              onChange={(e) => {
                setCollectorName(e.target.value);
                setSelectedPickup(null);
                setVerifyError("");
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            {nameNeedsFlag(collectorName) && (
              <div className="mb-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-xl px-3 py-2">
                This name is not authorised. Tap Verify to send it to the manager queue.
              </div>
            )}

            {verifyError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">
                {verifyError}
              </div>
            )}

            <p className="text-xs font-medium text-gray-500 mb-2">AUTHORISED PICKUPS</p>
            <div className="space-y-2">
              {authorisedPickups.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setSelectedPickup(person.name);
                    setCollectorName(person.name);
                    setVerifyError("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left shadow-md ${
                    selectedPickup === person.name ? "border-cyan-400 bg-cyan-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <span>{selectedPickup === person.name ? "Yes" : ""}</span>
                  {person.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedPickup("Walking Home");
                  setCollectorName("Walking Home");
                  setVerifyError("");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left shadow-md ${
                  selectedPickup === "Walking Home" ? "border-cyan-400 bg-cyan-50" : "border-gray-200 bg-white"
                }`}
              >
                Walking Home
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={resetFlow} className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-lg">
              Cancel
            </button>
            <button type="button" onClick={tryVerify} className="flex-1 py-3 rounded-full bg-orange-400 text-white font-semibold shadow-lg">
              Verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "flagged") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <Header />
        <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5 text-center shadow-lg">
            <p className="font-bold text-orange-700 text-lg">Needs manager approval</p>
            <p className="text-sm text-gray-600 mt-2">{flagReason}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-6 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Learner</span><span className="font-medium">{selectedLearner.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Collector</span><span className="font-medium">{collectorName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Teacher</span><span className="font-medium">{displayName}</span></div>
          </div>
          <button type="button" onClick={() => setStep("flaggedDone")} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg mb-3">
            Send to manager queue
          </button>
          {isManager && (
            <button type="button" onClick={() => setStep("confirmed")} className="w-full py-3 rounded-full bg-white text-gray-700 font-medium border border-gray-200 shadow-lg mb-3">
              Override and approve
            </button>
          )}
          <button type="button" onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-500">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (step === "flaggedDone") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <Header />
        <div className={`flex-1 px-4 pt-5 pb-32 flex flex-col items-center justify-center ${shell}`}>
          <div className="bg-white rounded-2xl p-6 text-center mb-8 w-full shadow-lg border border-gray-200">
            <p className="font-bold text-gray-900 text-lg">Sent to the manager queue</p>
            <p className="text-sm text-gray-600 mt-2">
              {selectedLearner.name} will not leave until a manager approves this collection.
            </p>
          </div>
          <button type="button" onClick={resetFlow} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg">
            Back to list
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirmed") {
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <Header />
        <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 text-center shadow-lg">
            <p className="font-bold text-green-700 text-lg">Verified</p>
            <p className="text-sm text-gray-600 mt-1">{collectorName} is authorised to collect {selectedLearner.name}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Learner</span><span className="font-medium">{selectedLearner.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Collector</span><span className="font-medium">{collectorName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{timeNow}</span></div>
          </div>
          <button type="button" onClick={handleConfirmSignOut} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg mb-3">
            Confirm Sign-Out
          </button>
          <button type="button" onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-500">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <Header />
        <div className={`flex-1 px-4 pt-5 pb-32 flex flex-col items-center justify-center ${shell}`}>
          <div className="bg-orange-50 rounded-2xl p-6 text-center mb-8 w-full shadow-lg border border-orange-200">
            <p className="font-bold text-orange-600 text-xl mb-1">{selectedLearner.name.split(" ")[0]} is signed out</p>
            <p className="text-sm text-gray-600">Collected by {collectorName}</p>
          </div>
          <button type="button" onClick={resetFlow} className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold shadow-lg">
            Sign Out Another Learner
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default SignOut;