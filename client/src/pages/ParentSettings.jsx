import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/apiClient";
import { logout, useSession } from "../services/session";
import ChangePasswordForm from "./ChangePasswordForm";

function ParentSettings() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/guardian/me")
      .then((me) => { if (!cancelled) setProfile(me); })
      .catch((e) => { if (!cancelled) setProfileError(e?.message || "Couldn't load your details."); });
    return () => { cancelled = true; };
  }, []);
  const children = profile?.children ?? [];
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">{user?.fullName}</p>
            <p className="text-xs text-gray-500">Parent</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/parent")}
          className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 px-4 md:px-6 pt-5 pb-32 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto w-full space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        <div className={card}>
          <h2 className="font-semibold text-gray-900 mb-3">Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-gray-500">Name</span><span className="font-medium text-right">{user?.fullName}</span></div>
            {profile && (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">{children.length === 1 ? "Child" : "Children"}</span>
                  <span className="font-medium text-right">{children.map((c) => c.name).join(", ") || "None linked yet"}</span>
                </div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Phone</span><span className="font-medium text-right">{profile.contactNumber}</span></div>
              </>
            )}
            {!profile && !profileError && <p className="text-gray-400">Loading your details...</p>}
            {profileError && <p role="alert" className="text-red-500">{profileError}</p>}
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