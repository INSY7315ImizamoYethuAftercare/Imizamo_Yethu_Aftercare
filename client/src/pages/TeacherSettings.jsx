import { useNavigate } from "react-router-dom";
import { logout, useSession } from "../services/session";
import { useHeader } from "./UseHeader";
import ChangePasswordForm from "./ChangePasswordForm";

// A teacher's own settings: their profile, changing their password and
// logging out. (School-wide settings are the manager's.)
function TeacherSettings() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { displayName, displayRole } = useHeader();
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";

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
          onClick={() => navigate("/home")}
          className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-lg mx-auto w-full space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-gray-500">Name</span><span className="font-medium text-right">{displayName}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Email</span><span className="font-medium text-right break-all">{user?.email}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Role</span><span className="font-medium text-right">{displayRole}</span></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">To change your name or email, ask the master admin.</p>
        </div>

        <ChangePasswordForm />

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Account</h2>
          <button
            onClick={async () => {
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

export default TeacherSettings;
