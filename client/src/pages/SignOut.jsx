import { useState } from "react";

function SignOut() {
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
  const [step, setStep] = useState("list"); // list | verify | confirmed | success

  const authorisedPickups = [
    { id: 1, name: "Fatima Petersen" },
    { id: 2, name: "Ahmed Petersen" },
    { id: 3, name: "Zainab Hendricks" },
  ];

  const filteredLearners = learners.filter((learner) =>
    learner.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetFlow = () => {
    setSelectedLearner(null);
    setCollectorName("");
    setSelectedPickup(null);
    setStep("list");
  };

  const handleConfirmSignOut = () => {
    // Move learner to collected list
    setCollected([
      ...collected,
      {
        ...selectedLearner,
        collectedBy: collectorName,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    // Remove from active list
    setLearners(learners.filter((l) => l.id !== selectedLearner.id));
    setStep("success");
  };

  // ========== SCREEN 1: List ==========
  if (step === "list") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
              <p className="text-xs text-gray-500">Teacher • Yellow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">🔔</span></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">⋮</span></button>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-28">
          <div className="mb-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Digital Sign-Out <span>🚪</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredLearners.length} learners still to be collected
            </p>
          </div>

          <div className="mt-4 mb-5">
            <input
              type="text"
              placeholder="Search learner name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div className="space-y-3 mb-6">
            {filteredLearners.map((learner) => (
              <div key={learner.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><span>✓</span> {learner.status}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedLearner(learner);
                    setStep("verify");
                  }}
                  className="px-4 py-1.5 rounded-full bg-orange-100 text-orange-500 text-sm font-medium"
                >
                  Sign Out →
                </button>
              </div>
            ))}
          </div>

          {/* Already collected today */}
          {collected.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-3 tracking-wide">ALREADY COLLECTED TODAY</p>
              <div className="space-y-2">
                {collected.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">{item.name}</p>
                    <p className="text-xs text-gray-400">✓ {item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏠</span><span className="text-[10px]">Home</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">✓</span><span className="text-[10px]">Attendance</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🎒</span><span className="text-[10px]">Learners</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏫</span><span className="text-[10px]">Classes</span></button>
          <button className="flex flex-col items-center text-orange-500 gap-0.5"><span className="text-lg">🚪</span><span className="text-[10px] font-medium">Sign Out</span></button>
        </div>
      </div>
    );
  }

  // ========== SCREEN 2: Verify Collector ==========
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
              <p className="text-xs text-gray-500">Teacher • Yellow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">🔔</span></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">⋮</span></button>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-28">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Digital Sign-Out <span>🚪</span></h1>
            <p className="text-sm text-gray-500 mt-1">{learners.length} learners still to be collected</p>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 mb-5">
            <p className="text-xs text-gray-500 mb-1">SIGNING OUT</p>
            <p className="font-bold text-gray-900 text-lg">{selectedLearner.name}</p>
            <p className="text-sm text-gray-600">{selectedLearner.grade} • {selectedLearner.group}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span>🔍</span>
              <h2 className="font-semibold text-gray-900">Verify Collector</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">Enter the name of the person collecting</p>

            <input
              type="text"
              placeholder="Type collector name..."
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            <p className="text-xs font-medium text-gray-500 mb-2">AUTHORISED PICKUPS</p>
            <div className="space-y-2">
              {authorisedPickups.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedPickup(person.name);
                    setCollectorName(person.name);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                    selectedPickup === person.name
                      ? "border-cyan-400 bg-cyan-50 text-gray-900"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  <span>{selectedPickup === person.name ? "✓" : "👤"}</span>
                  {person.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedPickup("Walking Home");
                  setCollectorName("Walking Home");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                  selectedPickup === "Walking Home"
                    ? "border-cyan-400 bg-cyan-50 text-gray-900"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                <span>🚶</span> Walking Home
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={resetFlow} className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-medium">
              ← Cancel
            </button>
            <button
              onClick={() => {
                if (collectorName.trim()) setStep("confirmed");
              }}
              className="flex-1 py-3 rounded-full bg-orange-400 text-white font-medium"
            >
              Verify ✓
            </button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏠</span><span className="text-[10px]">Home</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">✓</span><span className="text-[10px]">Attendance</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🎒</span><span className="text-[10px]">Learners</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏫</span><span className="text-[10px]">Classes</span></button>
          <button className="flex flex-col items-center text-orange-500 gap-0.5"><span className="text-lg">🚪</span><span className="text-[10px] font-medium">Sign Out</span></button>
        </div>
      </div>
    );
  }

  // ========== SCREEN 3: Verified + Confirm ==========
  if (step === "confirmed") {
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
              <p className="text-xs text-gray-500">Teacher • Yellow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">🔔</span></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">⋮</span></button>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-28">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Digital Sign-Out <span>🚪</span></h1>
            <p className="text-sm text-gray-500 mt-1">{learners.length} learners still to be collected</p>
          </div>

          {/* Verified banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-bold text-green-700 text-lg">Verified!</p>
            <p className="text-sm text-gray-600 mt-1">
              {collectorName} is authorised to collect {selectedLearner.name}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Sign-Out Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Learner</span>
                <span className="font-medium text-gray-900">{selectedLearner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Collector</span>
                <span className="font-medium text-gray-900">{collectorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">{timeNow}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teacher</span>
                <span className="font-medium text-gray-900">Ms Nkosi</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmSignOut}
            className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-3"
          >
            Confirm Sign-Out 🚪
          </button>
          <button onClick={() => setStep("verify")} className="w-full text-center text-sm text-gray-500">
            Go back
          </button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏠</span><span className="text-[10px]">Home</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">✓</span><span className="text-[10px]">Attendance</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🎒</span><span className="text-[10px]">Learners</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏫</span><span className="text-[10px]">Classes</span></button>
          <button className="flex flex-col items-center text-orange-500 gap-0.5"><span className="text-lg">🚪</span><span className="text-[10px] font-medium">Sign Out</span></button>
        </div>
      </div>
    );
  }

  // ========== SCREEN 4: Success ==========
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">Ms Nkosi</p>
              <p className="text-xs text-gray-500">Teacher • Yellow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">🔔</span></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><span className="text-lg">⋮</span></button>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-28 flex flex-col items-center justify-center">
          <div className="bg-orange-50 rounded-2xl p-6 text-center mb-8 w-full">
            <div className="text-4xl mb-3">⭐</div>
            <p className="font-bold text-orange-600 text-xl mb-1">
              {selectedLearner.name.split(" ")[0]} is signed out!
            </p>
            <p className="text-sm text-gray-600">
              Collected by {collectorName} at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base"
          >
            Sign Out Another Learner
          </button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center">
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏠</span><span className="text-[10px]">Home</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">✓</span><span className="text-[10px]">Attendance</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🎒</span><span className="text-[10px]">Learners</span></button>
          <button className="flex flex-col items-center text-gray-400 gap-0.5"><span className="text-lg">🏫</span><span className="text-[10px]">Classes</span></button>
          <button className="flex flex-col items-center text-orange-500 gap-0.5"><span className="text-lg">🚪</span><span className="text-[10px] font-medium">Sign Out</span></button>
        </div>
      </div>
    );
  }

  return null;
}

export default SignOut;