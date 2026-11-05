import { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import { useSession } from "../services/session";
import EditAccountForm from "./EditAccountForm";
import ResetPasswordForm from "./ResetPasswordForm";

// Master admin only (shown on the Staff page): every manager and admin
// account, a form to create a manager or a standard admin
// (GET/POST /api/accounts), and editing them (PATCH /api/accounts/:userId).

const TYPES = [
  { value: "manager", label: "Manager", hint: "Runs the hub: learners, classes, teachers, attendance and sign-out." },
  { value: "standard_admin", label: "Standard admin", hint: "Sees reports and totals only, never individual learners." },
];

const TYPE_LABEL = { manager: "Manager", standard_admin: "Standard admin", master_admin: "Master admin" };

const EMPTY = { type: "manager", fullName: "", email: "", password: "" };

function AccountsSection() {
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm";
  const label = "text-xs font-medium text-gray-500 mb-1 block";

  const [accounts, setAccounts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState("");
  // The account being edited or reset, as { id, mode: "edit" | "reset" }.
  const [open, setOpen] = useState(null);
  const close = () => setOpen(null);
  const { user } = useSession();
  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const isMe = (a) => a.userId === user?.userId;
  // Your own account, or anyone who isn't another master admin.
  const canEdit = (a) => isMe(a) || a.type !== "master_admin";
  // You change your own password in Settings (it asks for the current one).
  const canReset = (a) => !isMe(a) && a.type !== "master_admin";

  const handleEdited = async (updated) => {
    close();
    setBanner(`${updated.fullName}'s account was updated.`);
    setTimeout(() => setBanner(""), 3000);
    await load();
  };
  const handleReset = (account) => {
    close();
    setBanner(`${account.fullName}'s password was reset. Ask them to change it in Settings.`);
    setTimeout(() => setBanner(""), 5000);
  };

  const load = async () => {
    try {
      setAccounts(await apiClient.get("/accounts"));
      setLoadError("");
    } catch (e) {
      setLoadError(e.message || "Couldn't load the accounts.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const closeForm = () => {
    setAdding(false);
    setDraft(EMPTY);
    setAddError("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const fullName = draft.fullName.trim();
    const email = draft.email.trim();
    if (!fullName || !email || !draft.password) return setAddError("Please fill in every field.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAddError("Please enter a valid email address.");
    if (draft.password.length < 8) return setAddError("The starting password must be at least 8 characters.");
    setSaving(true);
    setAddError("");
    try {
      const created = await apiClient.post("/accounts", { type: draft.type, fullName, email, password: draft.password });
      closeForm();
      setBanner(`${created.fullName} was added as a ${TYPE_LABEL[created.type].toLowerCase()}. Give them their email and starting password to sign in. They'll choose their own password the first time.`);
      setTimeout(() => setBanner(""), 5000);
      await load();
    } catch (err) {
      setAddError(err.message || "Could not add this account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="accounts-heading" className="mt-8">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 id="accounts-heading" className="text-xl font-bold text-gray-900 mb-1">Managers & admins</h2>
          <p className="text-sm text-gray-500">Only you, the master admin, can add these accounts</p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-lg hover:bg-orange-500 active:scale-95 transition whitespace-nowrap"
          >
            + Add account
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} noValidate className={`${card} mb-5`}>
          <h3 className="font-semibold text-gray-900 mb-3">Add a manager or admin</h3>
          <fieldset className="mb-4">
            <legend className={label}>ACCOUNT TYPE</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex gap-2 items-start rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                    draft.type === t.value ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200"
                  }`}
                >
                  <input type="radio" name="account-type" value={t.value} checked={draft.type === t.value} onChange={setField("type")} className="mt-1 accent-orange-500" />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{t.label}</span>
                    <span className="block text-xs text-gray-500">{t.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-3 mb-4">
            <div>
              <label htmlFor="new-account-name" className={label}>FULL NAME</label>
              <input id="new-account-name" value={draft.fullName} onChange={setField("fullName")} placeholder="e.g. Sarah Botha" className={input} />
            </div>
            <div>
              <label htmlFor="new-account-email" className={label}>EMAIL (THEY SIGN IN WITH THIS)</label>
              <input id="new-account-email" type="email" value={draft.email} onChange={setField("email")} placeholder="name@iylh.org" className={input} />
            </div>
            <div>
              <label htmlFor="new-account-password" className={label}>STARTING PASSWORD</label>
              <input id="new-account-password" type="password" autoComplete="new-password" value={draft.password} onChange={setField("password")} placeholder="At least 8 characters" className={input} />
            </div>
          </div>
          {addError && <p role="alert" className="text-sm text-red-500 mb-3">{addError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-full bg-beige text-gray-500 font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold shadow-md disabled:opacity-60">
              {saving ? "Adding..." : `Add ${TYPE_LABEL[draft.type].toLowerCase()}`}
            </button>
          </div>
        </form>
      )}

      {banner && (
        <div role="status" className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
          {banner}
        </div>
      )}
      {loadError && <p role="alert" className="text-sm text-red-500 mb-3">{loadError}</p>}

      <ul className="space-y-3">
        {accounts.map((a) =>
          open?.id === a.userId ? (
            <li key={a.userId}>
              {open.mode === "edit" ? (
                <EditAccountForm account={a} onSaved={handleEdited} onCancel={close} />
              ) : (
                <ResetPasswordForm account={a} onDone={handleReset} onCancel={close} />
              )}
            </li>
          ) : (
            <li key={a.userId} className={`${card} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{a.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{TYPE_LABEL[a.type] ?? a.type} • {a.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                    a.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {a.isActive ? "Active" : "Suspended"}
                </span>
                {canEdit(a) && (
                  <button
                    type="button"
                    onClick={() => setOpen({ id: a.userId, mode: "edit" })}
                    aria-label={`Edit ${a.fullName}`}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200 shadow-lg hover:border-orange-300 hover:shadow-xl active:scale-95 transition"
                  >
                    Edit
                  </button>
                )}
                {canReset(a) && (
                  <button
                    type="button"
                    onClick={() => setOpen({ id: a.userId, mode: "reset" })}
                    aria-label={`Reset password for ${a.fullName}`}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-red-500 border border-red-200 shadow-lg hover:shadow-xl active:scale-95 transition"
                  >
                    Reset password
                  </button>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

export default AccountsSection;
