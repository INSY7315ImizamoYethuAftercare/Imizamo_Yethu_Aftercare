import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/session";
import { useClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";

function Settings({ role = "Manager" }) {
  const navigate = useNavigate();
  const isAdmin = role === "Admin";
  const homePath = isAdmin ? "/admin" : "/manager";
  const { displayName, displayRole } = useHeader();
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const primary = "w-full py-3 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition";
  const input = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-300";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [year, setYear] = useState("2025");
  const [activeTerm, setActiveTerm] = useState("Term 3");
  const [newClass, setNewClass] = useState("");
  const sharedClasses = useClasses();
  const [classes, setClasses] = useState(sharedClasses.map((c) => c.name));
  const [saved, setSaved] = useState("");

  const showSaved = (text) => {
    setSaved(text);
    setTimeout(() => setSaved(""), 2200);
  };

  const handlePassword = (e) => {
    e.preventDefault();
    if (!current || !next || !confirm) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (next !== confirm) {
      setMessage("New passwords do not match.");
      return;
    }
    setMessage("Password updated.");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

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
        <button
          onClick={() => navigate(homePath)}
          className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-lg mx-auto w-full space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            {saved}
          </div>
        )}

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">School year</h2>
          <select value={year} onChange={(e) => setYear(e.target.value)} className={`${input} mb-3`}>
            <option>2024</option>
            <option>2025</option>
            <option>2026</option>
          </select>
          <button onClick={() => showSaved("School year set to " + year)} className={primary}>Save year</button>
        </div>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Terms</h2>
          <div className="space-y-2 mb-3">
            {["Term 1", "Term 2", "Term 3", "Term 4"].map((term) => (
              <button
                key={term}
                onClick={() => setActiveTerm(term)}
                className={`w-full px-4 py-3 rounded-xl border text-left text-sm shadow-lg active:scale-[0.98] transition ${
                  activeTerm === term
                    ? "border-orange-400 bg-orange-50 font-semibold"
                    : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-xl"
                }`}
              >
                {term}{activeTerm === term ? " — current" : ""}
              </button>
            ))}
          </div>
          <button onClick={() => showSaved(activeTerm + " is now current")} className={primary}>Save term</button>
        </div>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Class groups</h2>
          <div className="space-y-2 mb-3">
            {classes.map((cls) => (
              <div key={cls} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-lg">
                <span className="text-sm font-medium text-gray-800">{cls}</span>
                <button
                  onClick={() => setClasses(classes.filter((c) => c !== cls))}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 bg-white border border-red-200 shadow-md hover:shadow-lg active:scale-95 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <input
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            placeholder="New class name"
            className={`${input} mb-3`}
          />
          <button
            onClick={() => {
              if (!newClass.trim()) return;
              setClasses([...classes, newClass.trim()]);
              setNewClass("");
              showSaved("Class group added");
            }}
            className={primary}
          >
            Add class
          </button>
        </div>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{displayName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">{displayRole}</span></div>
          </div>
        </div>

        <form onSubmit={handlePassword} className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Change password</h2>
          <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={`${input} mb-2`} />
          <input type="password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} className={`${input} mb-2`} />
          <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${input} mb-3`} />
          {message && <p className="text-xs text-gray-600 mb-3">{message}</p>}
          <button type="submit" className={primary}>Update password</button>
        </form>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Account</h2>
          <button
            onClick={async () => {
              // End the session first; otherwise the sign-in page sees a valid
              // cookie and sends the user straight back here.
              await logout();
              navigate("/", { replace: true });
            }}
            className="w-full py-3 rounded-full bg-white text-red-500 font-semibold border border-red-200 shadow-lg hover:shadow-xl active:scale-[0.98] transition"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;