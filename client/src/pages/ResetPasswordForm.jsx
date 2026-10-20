import { useState } from "react";
import { apiClient } from "../services/apiClient";

// Master admin only: for a staff member who has forgotten their password
// (POST /api/accounts/:userId/reset-password). Everyday changes are made
// by the person themselves in Settings.
//
// `account` is { userId, fullName }. onDone is called after a reset.
function ResetPasswordForm({ account, onDone, onCancel }) {
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-red-200";
  const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm";
  const label = "text-xs font-medium text-gray-500 mb-1 block";
  const id = `reset-password-${account.userId}`;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirm) return setError("Please fill in both fields.");
    if (password !== confirm) return setError("The passwords do not match.");
    if (password.length < 8) return setError("The new password must be at least 8 characters.");

    setSaving(true);
    setError("");
    try {
      await apiClient.post(`/accounts/${account.userId}/reset-password`, { password });
      onDone(account);
    } catch (err) {
      setError(err.message || "Could not reset this password. Please try again.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleReset} noValidate className={card} aria-label={`Reset password for ${account.fullName}`}>
      <h3 className="font-semibold text-gray-900 mb-1">Reset password for {account.fullName}</h3>
      <p className="text-xs text-gray-500 mb-3">
        Only if they've forgotten it. Give them the new password in person, and ask them to change it in Settings
        straight away.
      </p>
      <div className="space-y-3 mb-4">
        <div>
          <label htmlFor={`${id}-new`} className={label}>NEW PASSWORD</label>
          <input id={`${id}-new`} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={input} />
        </div>
        <div>
          <label htmlFor={`${id}-confirm`} className={label}>CONFIRM NEW PASSWORD</label>
          <input id={`${id}-confirm`} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-500 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-md">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-semibold shadow-md disabled:opacity-60">
          {saving ? "Resetting..." : "Reset password"}
        </button>
      </div>
    </form>
  );
}

export default ResetPasswordForm;
