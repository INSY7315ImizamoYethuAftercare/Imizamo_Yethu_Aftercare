import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Teacher");
  const [email, setEmail] = useState("nkosi@iylh.org");
  const [password, setPassword] = useState("••••••••");

  const roles = [
    { name: "Teacher", icon: "🍎" },
    { name: "Manager", icon: "📋" },
    { name: "Admin", icon: "⚙️" },
    { name: "Parent", icon: "💛" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4">
      
      {/* Logo */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain" />
        <h1 className="text-2xl font-bold text-gray-900">Imizamo Yethu</h1>
        <p className="text-sm text-purple-500">Aftercare System</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm">
        <p className="text-sm font-medium text-gray-500 mb-3">Sign in as</p>

        {/* Role Selection */}
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

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 mb-1 block">EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-500 mb-1 block">PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Sign In Button */}
<button
  onClick={() => {
    if (role === "Manager") {
      navigate("/manager");
    } else {
      navigate("/home");
    }
  }}
  className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base mb-4"
>
  Sign In
</button>

        <p className="text-xs text-center text-gray-400 mb-3">
          Demo: select any role above and tap Sign In
        </p>

        <p className="text-sm text-center text-gray-500">
          New to the hub?{" "}
        <button 
          onClick={() => navigate("/register")} className="text-orange-500 font-medium">
          Create an account →
        </button>
        </p>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        © 2025 Imizamo Yethu Learning Hub
      </p>
    </div>
  );
}

export default Login;