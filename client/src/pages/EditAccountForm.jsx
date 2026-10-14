import { useState } from "react";
import { apiClient } from "../services/apiClient";

// Master admin only: edit a teacher, manager or admin's name or sign-in
// email (PATCH /api/accounts/:userId). Only the fields that changed are
// sent. Passwords aren't changed here: see ResetPasswordForm.
//
// `account` is { userId, fullName, email }. onSaved gets the updated account.
function EditAccountForm({ account, onSaved, onCancel }) {
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-orange-300";
  const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm";
  const label = "text-xs font-medium text-gray-500 mb-1 block";
  const id = `edit-account-${account.userId}`;

  const [draft, setDraft] = useState({ fullName: account.fullName ?? "", email: account.email ?? "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const fullName = draft.fullName.trim();
    const email = draft.email.trim();
    if (!fullName || !email) return setError("Please enter a name and email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");

    const changes = {};
    if (fullName !== account.fullName) changes.fullName = fullName;
    if (email.toLowerCase() !== (account.email ?? "").toLowerCase()) changes.email = email;
    if (Object.keys(changes).length === 0) return onCancel();

    setSaving(true);
    setError("");
    try {
      const updated = await apiClient.patch(`/accounts/${account.userId}`, changes);
      onSaved(updated, changes);
    } catch (err) {
      setError(err.message || "Could not save these changes. Please try again.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} noValidate className={card} aria-label={`Edit ${account.fullName}`}>
      <h3 className="font-semibold text-gray-900 mb-3">Edit {account.fullName}</h3>
      <div className="space-y-3 mb-4">
        <div>
          <label htmlFor={`${id}-name`} className={label}>FULL NAME</label>
          <input id={`${id}-name`} value={draft.fullName} onChange={setField("fullName")} className={input} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={label}>EMAIL (THEY SIGN IN WITH THIS)</label>
          <input id={`${id}-email`} type="email" value={draft.email} onChange={setField("email")} className={input} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-500 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-md">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold shadow-md disabled:opacity-60">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default EditAccountForm;
