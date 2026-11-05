import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { homePathFor, logout, restoreSession, useSession } from "../services/session";
import ChangePasswordForm from "./ChangePasswordForm";

// Shown after a master admin resets someone's forgotten password: they must
// replace the temporary password with their own before using the app. The
// server refuses every other request until they do.
function ChoosePassword() {
  const navigate = useNavigate();
  const { user, status } = useSession();
  useEffect(() => {
    restoreSession();
  }, []);

  if (status === "unknown") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!user.mustChangePassword) return <Navigate to={homePathFor(user.appRole)} replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center px-4 pt-10 pb-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Hi {user.fullName}. Your password was set for you by someone else. Enter the temporary password you were given,
            then choose your own. Only you will know it.
          </p>
        </div>

        <ChangePasswordForm
          title="Your new password"
          currentLabel="Temporary password"
          onChanged={() => navigate(homePathFor(user.appRole), { replace: true })}
        />

        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate("/", { replace: true });
          }}
          className="w-full py-3 rounded-full bg-white text-red-500 font-semibold border border-red-200 shadow-lg active:scale-[0.98] transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default ChoosePassword;
