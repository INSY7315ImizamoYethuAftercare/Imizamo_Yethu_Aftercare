import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { login, restoreSession, homePathFor, useSession } from "../services/session";

function Login() {
  const navigate = useNavigate();
  // e.g. "Account created. Please sign in." after registering.
  const notice = useLocation().state?.message;
  const { user, status } = useSession();
  const [role, setRole] = useState("Teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // `key` is the account role the server checks the picked card against.
  const roles = [
    { name: "Teacher", key: "teacher", icon: "🍎" },
    { name: "Manager", key: "manager", icon: "📋" },
    { name: "Admin", key: "admin", icon: "⚙️" },
    { name: "Parent", key: "guardian", icon: "💛" },
  ];

  // Already signed in (e.g. refreshed the page)? Go straight to your home page.
  useEffect(() => {
    restoreSession();
  }, []);
  useEffect(() => {
    if (status === "authed" && user) navigate(homePathFor(user.appRole), { replace: true });
  }, [status, user, navigate]);

  const handleSignIn = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) return setError("Please enter your email and password.");
    setBusy(true);
    setError("");
    try {
      const roleKey = roles.find((r) => r.name === role).key;
      // The server refuses the sign-in if the picked card doesn't match the account.
      const signedIn = await login(email.trim(), password, roleKey);
      // A master admin picks Admin but lands on the manager pages (see appRoleOf).
      navigate(homePathFor(signedIn.appRole), { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-start px-4 pt-10 pb-8 overflow-y-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center p-3">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Imizamo Yethu</h1>
        <p className="text-sm text-purple-500 mt-1">Learning Hub • Aftercare System</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm">
        <p className="text-sm font-medium text-gray-500 mb-3">Sign in as</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map((r) => (
            <button
              key={r.name}
              onClick={() => setRole(r.name)}
              className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition active:scale-95 ${
                role === r.name
                  ? "border-orange-400 bg-orange-50 shadow-sm"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <span className="text-sm font-medium text-gray-800">
                {r.name === "Parent" ? "Parent/Guardian" : r.name}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSignIn}>
        <div className="mb-4">
          <label htmlFor="login-email" className="text-xs font-medium text-gray-500 mb-1 block">EMAIL</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="login-password" className="text-xs font-medium text-gray-500 mb-1 block">PASSWORD</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {notice && !error && <p role="status" className="text-sm text-center text-green-600 mb-4">{notice}</p>}
        {error && <p className="text-sm text-center text-red-500 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base shadow-md hover:bg-orange-500 active:scale-[0.98] transition mb-4 disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          New to the hub?{" "}
          <button onClick={() => navigate("/register")} className="text-orange-500 font-medium">
            Create an account →
          </button>
        </p>
      </div>

      <p className="text-xs text-gray-400 mt-8">© 2025 Imizamo Yethu Learning Hub</p>
    </div>
  );
}

export default Login;