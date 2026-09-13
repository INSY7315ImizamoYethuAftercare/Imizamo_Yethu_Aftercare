import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentHome() {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const [showAddPickup, setShowAddPickup] = useState(false);
  const [walkAlone, setWalkAlone] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">Fatima Petersen</p>
            <p className="text-xs text-gray-500">Parent</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <button
            onClick={() => navigate("/parent/settings")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-orange-300 to-yellow-300 rounded-2xl p-5 mb-5 text-white shadow-md">
          <h1 className="text-xl font-bold">Welcome, Fatima! 💛</h1>
          <p className="text-sm mt-1 opacity-90">Here’s how Aisha is doing</p>
        </div>

        {/* Child card */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Aisha Petersen</h2>
          <p className="text-sm text-gray-500 mb-3">Grade 2 • Yellow</p>
          <div className="flex gap-2 mb-4">
            <span className="px-2.5 py-1 bg-pink-100 text-pink-600 text-[11px] font-medium rounded-full">Reading Club</span>
            <span className="px-2.5 py-1 bg-purple-100 text-purple-600 text-[11px] font-medium rounded-full">Art</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-green-500">94%</p>
              <p className="text-[10px] text-gray-500">Attendance</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-500">Present ✓</p>
              <p className="text-[10px] text-gray-500">Today</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-500">2</p>
              <p className="text-[10px] text-gray-500">Updates</p>
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">✓ Aisha is at aftercare today</p>
          <p className="text-xs text-gray-500 mt-1">Signed out by Zainab Hendricks at 17:00</p>
        </div>

        {/* Teacher Observations */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">Teacher Observations</h2>
            <p className="text-xs text-gray-400">2 updates recorded</p>
          </div>
          <button onClick={comingSoon} className="text-xs font-semibold text-orange-500">View all 2 ↓</button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-cyan-500">Social</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 font-medium">Latest</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">2025-07-15</p>
          <p className="text-sm text-gray-700 mb-2">Showed great leadership during group activity today.</p>
          <p className="text-xs text-gray-400">— Ms Nkosi</p>
        </div>

        <button onClick={comingSoon} className="w-full py-2.5 rounded-full bg-purple-50 text-purple-600 text-sm font-semibold mb-6 shadow-sm hover:bg-purple-100 active:scale-[0.98] transition">
          + 1 more observation →
        </button>

        {/* Authorised Pickups */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Authorised Pickups</h2>
          <button
            onClick={() => setShowAddPickup(true)}
            className="px-3 py-1.5 rounded-full bg-orange-400 text-white text-xs font-semibold shadow-md hover:bg-orange-500 active:scale-95 transition"
          >
            + Add Person
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {["Fatima Petersen", "Ahmed Petersen", "Zainab Hendricks"].map((name) => (
            <div key={name} className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">👤</span>
                <p className="text-sm font-medium text-gray-800">{name}</p>
              </div>
              <span className="text-xs text-emerald-500 font-medium">✓ Authorised</span>
            </div>
          ))}
        </div>

        {/* This Week */}
        <h2 className="font-semibold text-gray-900 mb-3">This Week</h2>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100 mb-6">
          {[
            { date: "2025-07-25", detail: "Collected by Zainab Hendricks · 17:00", status: "Present", ok: true },
            { date: "2025-07-24", detail: "Collected by Fatima Petersen · 17:15", status: "Present", ok: true },
            { date: "2025-07-23", detail: "", status: "Absent", ok: false },
            { date: "2025-07-22", detail: "Collected by Ahmed Petersen · 17:45", status: "Present", ok: true },
            { date: "2025-07-21", detail: "Collected by Fatima Petersen · 17:30", status: "Present", ok: true },
          ].map((row) => (
            <div key={row.date} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={row.ok ? "text-green-500" : "text-red-500"}>{row.ok ? "✓" : "✗"}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{row.date}</p>
                  {row.detail && <p className="text-xs text-gray-400">{row.detail}</p>}
                </div>
              </div>
              <span className={`text-xs font-semibold ${row.ok ? "text-green-500" : "text-red-400"}`}>{row.status}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-4 border border-orange-200 bg-orange-50 shadow-sm">
          <p className="text-sm font-semibold text-orange-600 mb-1">☎ Need to get in touch?</p>
          <p className="text-xs text-gray-600">Teacher: Ms Nkosi · nkosi@iylh.org</p>
          <p className="text-xs text-gray-600">Hub: 021 000 1234 · Mon–Fri 13:00–18:00</p>
        </div>
      </div>

      {/* Add Authorised Pickup Modal */}
      {showAddPickup && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Add Authorised Pickup</h2>
            <p className="text-sm text-gray-500 mb-4">
              This person will be allowed to collect Aisha. The hub may request ID verification.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">FULL NAME *</label>
                <input placeholder="e.g. Zainab Hendricks" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">RELATIONSHIP TO CHILD</label>
                <input placeholder="e.g. Aunt, Grandparent, Neighbour" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">CONTACT NUMBER</label>
                <input placeholder="e.g. 072 345 6789" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ID NUMBER (optional)</label>
                <input placeholder="For verification purposes" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm" />
              </div>
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={walkAlone} onChange={(e) => setWalkAlone(e.target.checked)} className="mt-1" />
                <span>
                  <span className="font-medium">Aisha may walk home alone</span>
                  <span className="block text-xs text-gray-400">I give permission for my child to leave the hub unaccompanied</span>
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddPickup(false)}
                className="flex-1 py-3 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddPickup(false);
                  alert("Request submitted");
                }}
                className="flex-1 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-300 active:scale-[0.98] transition"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentHome;