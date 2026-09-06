import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = choose role, 2 = form
  const [role, setRole] = useState("Teacher");

  const roles = [
    { name: "Teacher", icon: "🍎" },
    { name: "Manager", icon: "📋" },
    { name: "Admin", icon: "⚙️" },
    { name: "Parent", icon: "💛" },
  ];

  // ===== STEP 1: Choose Role =====
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-purple-500">Aftercare System</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm">
          <p className="text-sm font-medium text-gray-700 mb-1">I am joining as...</p>
          <p className="text-xs text-gray-400 mb-4">Select your role to continue</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.name}
                onClick={() => setRole(r.name)}
                className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition ${
                  role === r.name
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className="text-sm font-medium text-gray-800">{r.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-4"
          >
            Continue as {role} →
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-sm text-gray-500"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ===== STEP 2: Registration Form =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-6">
        <img src="/logo.png" alt="Logo" className="w-14 h-14 mx-auto mb-2 object-contain" />
        <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
        <p className="text-sm text-purple-500">Imizamo Yethu Learning Hub</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm">
        {/* Selected Role Badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
            <span>🍎</span>
            <span className="text-sm font-medium text-orange-600">{role}</span>
          </div>
          <button onClick={() => setStep(1)} className="text-xs text-gray-400">
            Change
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">FIRST NAME</label>
              <input placeholder="Amara" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">LAST NAME</label>
              <input placeholder="Nkosi" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">EMAIL ADDRESS</label>
            <input placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">YOUR CLASS</label>
            <input placeholder="e.g. Yellow" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">PASSWORD</label>
            <input type="password" placeholder="Min. 6 characters" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">CONFIRM PASSWORD</label>
            <input type="password" placeholder="Repeat password" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">STAFF ACCESS CODE</label>
            <input placeholder="Provided by your manager" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <p className="text-xs text-gray-400 mt-1">Demo code: IYLH2025</p>
          </div>
        </div>

        <button className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-3">
          Create Account
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full text-center text-sm text-gray-500"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default Register;