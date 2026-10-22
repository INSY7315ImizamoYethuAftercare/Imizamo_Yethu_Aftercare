import { useNavigate } from "react-router-dom";
import { logout } from "../services/session";
import { useHeader } from "./UseHeader";
import ChangePasswordForm from "./ChangePasswordForm";

function Settings({ role = "Manager" }) {
  const navigate = useNavigate();
  const isAdmin = role === "Admin";
  const homePath = isAdmin ? "/admin" : "/manager";
  const { displayName, displayRole } = useHeader();
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const primary = "w-full py-3 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
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

        {!isAdmin && (
          <div className={card}>
            <h2 className="font-semibold text-gray-900 mb-1">Classes</h2>
            <p className="text-sm text-gray-500 mb-3">Add, edit and remove classes on the Classes page.</p>
            <button onClick={() => navigate("/manager/classes")} className={primary}>Manage classes →</button>
          </div>
        )}

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{displayName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">{displayRole}</span></div>
          </div>
        </div>

        <ChangePasswordForm />

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