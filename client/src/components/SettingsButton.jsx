import { useNavigate } from "react-router-dom";
import { settingsPathFor, useSession } from "../services/session";

// The ⚙️ in the page header. Opens the signed-in user's own Settings page,
// which is also where they log out.
function SettingsButton() {
  const navigate = useNavigate();
  const { user } = useSession();
  if (!user) return null;

  return (
    <button
      type="button"
      aria-label="Settings"
      onClick={() => navigate(settingsPathFor(user.appRole))}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
    >
      ⚙️
    </button>
  );
}

export default SettingsButton;
