import { useState } from "react";
import { changePassword } from "../services/session";

// "Change password" card on the Settings pages and the choose-password page.
// The server checks the current password (POST /api/auth/change-password).
// onChanged is called after a successful change.
function ChangePasswordForm({ title = "Change password", currentLabel = "Current password", onChanged }) {
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const input = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm shadow-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-300";
  const primary = "w-full py-3 rounded-full bg-orange-400 text-white font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition disabled:opacity-60";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState({ text: "", ok: false });
  const [saving, setSaving] = useState(false);

  const fail = (text) => setMessage({ text, ok: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current || !next || !confirm) return fail("Please fill in all fields.");
    if (next !== confirm) return fail("New passwords do not match.");
    if (next.length < 8) return fail("The new password must be at least 8 characters.");
    if (next === current) return fail("The new password must be different from your current one.");

    setSaving(true);
    setMessage({ text: "", ok: false });
    try {
      await changePassword(current, next);
      setMessage({ text: "Password updated. You've been signed out on any other devices.", ok: true });
      setCurrent("");
      setNext("");
      setConfirm("");
      onChanged?.();
    } catch (err) {
      fail(err.message || "Could not update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={card} aria-labelledby="change-password-heading">
      <h2 id="change-password-heading" className="font-semibold text-gray-900 mb-3">{title}</h2>
      <input type="password" aria-label={currentLabel} autoComplete="current-password" placeholder={currentLabel} value={current} onChange={(e) => setCurrent(e.target.value)} className={`${input} mb-2`} />
      <input type="password" aria-label="New password" autoComplete="new-password" placeholder="New password (at least 8 characters)" value={next} onChange={(e) => setNext(e.target.value)} className={`${input} mb-2`} />
      <input type="password" aria-label="Confirm new password" autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${input} mb-3`} />
      {message.text && (
        <p role={message.ok ? "status" : "alert"} className={`text-xs mb-3 ${message.ok ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={saving} className={primary}>
        {saving ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

export default ChangePasswordForm;
