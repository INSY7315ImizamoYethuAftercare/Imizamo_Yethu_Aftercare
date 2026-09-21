import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentSettings() {
  const navigate = useNavigate();
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

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
            <p className="text-sm font-semibold text-orange-500">Fatima Petersen</p>
            <p className="text-xs text-gray-500">Parent</p>
          </div>
        </div>
        <button onClick={() => navigate("/parent")} className="text-sm font-medium text-gray-600">← Back</button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-lg mx-auto w-full space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">Fatima Petersen</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Child</span><span className="font-medium">Aisha Petersen</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">072 345 6789</span></div>
          </div>
        </div>

        <form onSubmit={handlePassword} className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Change password</h2>
          <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full mb-2 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md" />
          <input type="password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} className="w-full mb-2 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md" />
          <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full mb-3 px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md" />
          {message && <p className="text-xs text-gray-600 mb-3">{message}</p>}
          <button type="submit" className="w-full py-3 rounded-full bg-orange-400 text-white font-semibold shadow-lg active:scale-[0.98] transition">
            Update password
          </button>
        </form>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Account</h2>
          <button onClick={() => navigate("/")} className="w-full py-3 rounded-full bg-white text-red-500 font-semibold border border-red-200 shadow-lg active:scale-[0.98] transition">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParentSettings;