import { useNavigate } from "react-router-dom";
import { logout } from "../services/session";
import ChangePasswordForm from "./ChangePasswordForm";

function ParentSettings() {
  const navigate = useNavigate();
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
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
            className="w-full py-3 rounded-full bg-white text-red-500 font-semibold border border-red-200 shadow-lg active:scale-[0.98] transition">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParentSettings;