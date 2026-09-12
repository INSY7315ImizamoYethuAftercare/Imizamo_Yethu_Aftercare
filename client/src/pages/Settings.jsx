import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Settings({ role = "Manager" }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const comingSoon = () => alert("Coming soon");

  const displayName = role === "Admin" ? "System Admin" : "Sarah Botha";
  const displayRole = role === "Admin" ? "Admin" : "Manager";

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">{displayName}</p>
            <p className="text-xs text-gray-500">{displayRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">🔔</button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-sm hover:bg-gray-100 active:scale-95 transition">⚙️</button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Settings <span>⚙️</span></h1>
          <p className="text-sm text-gray-500">Manage your account</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <p className="text-xs font-medium text-gray-400 mb-3">PROFILE</p>
          <p className="text-lg font-semibold text-gray-900">{displayName}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-orange-50 text-orange-500 text-xs font-medium rounded-full">
            {displayRole}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <p className="text-xs font-medium text-gray-400 mb-4">UPDATE PASSWORD</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">CURRENT PASSWORD</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">NEW PASSWORD</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">CONFIRM PASSWORD</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
          <button onClick={comingSoon} className="w-full py-3 rounded-full bg-orange-400 text-white font-semibold text-sm shadow-md hover:bg-orange-500 active:scale-[0.98] transition">
            Update Password
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 mb-3">ACCOUNT</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-red-100 active:scale-[0.98] transition"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;