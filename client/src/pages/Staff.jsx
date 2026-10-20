import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaff, setStaffStatus, createTeacher, refreshStaff } from "./UseTeachers";
import { useClasses, refreshClasses } from "./UseClasses";
import { useHeader } from "./UseHeader";
import AccountsSection from "./AccountsSection";
import EditAccountForm from "./EditAccountForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { isMasterAdmin, useSession } from "../services/session";

function Staff() {
  const { displayName, displayRole } = useHeader();
  const navigate = useNavigate();
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const [banner, setBanner] = useState("");
  const staff = useStaff();
  const classes = useClasses();
  const { user } = useSession();

  // "Add teacher" form. The new teacher signs in with this email and the
  // starting password the manager gives them.
  const EMPTY = { fullName: "", email: "", password: "" };
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm";
  const label = "text-xs font-medium text-gray-500 mb-1 block";
  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

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
      await createTeacher({ fullName, email, password: draft.password });
      closeForm();
      setBanner(fullName + " was added. Give them their email and starting password to sign in.");
      setTimeout(() => setBanner(""), 4000);
    } catch (err) {
      setAddError(err.message || "Could not add this teacher. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // A teacher's class comes from the Classes page, so assigning a teacher
  // there shows up here too.
  const groupFor = (person) =>
    person.role === "Manager" ? "All classes" : classes.find((c) => c.teacher === person.name)?.name ?? "No class";

  // Master admin only: the teacher being edited or having their password
  // reset, as { id, mode: "edit" | "reset" }.
  const [open, setOpen] = useState(null);
  const close = () => setOpen(null);
  const handleEdited = async (updated) => {
    close();
    setBanner(updated.fullName + "'s account was updated.");
    setTimeout(() => setBanner(""), 3000);
    // Classes show their teacher by name, so reload both after a rename.
    await Promise.all([refreshStaff(), refreshClasses()]);
  };
  const handleReset = (account) => {
    close();
    setBanner(account.fullName + "'s password was reset. Ask them to change it in Settings.");
    setTimeout(() => setBanner(""), 5000);
  };

  const toggle = (person) => {
    const next = person.status === "Active" ? "Suspended" : "Active";
    setStaffStatus(person.id, next);
    setBanner(person.name + " is now " + next.toLowerCase());
    setTimeout(() => setBanner(""), 2200);
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/manager")}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            ← Home
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff oversight</h1>
            <p className="text-sm text-gray-500">Teachers and managers linked to this hub</p>
          </div>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="px-4 py-2 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-lg hover:bg-orange-500 active:scale-95 transition whitespace-nowrap"
            >
              + Add teacher
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={handleAdd} noValidate className={`${card} mb-5`}>
            <h2 className="font-semibold text-gray-900 mb-3">Add a teacher</h2>
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="new-teacher-name" className={label}>FULL NAME</label>
                <input id="new-teacher-name" value={draft.fullName} onChange={setField("fullName")} placeholder="e.g. Thandeka Nkosi" className={input} />
              </div>
              <div>
                <label htmlFor="new-teacher-email" className={label}>EMAIL (THEY SIGN IN WITH THIS)</label>
                <input id="new-teacher-email" type="email" value={draft.email} onChange={setField("email")} placeholder="name@iylh.org" className={input} />
              </div>
              <div>
                <label htmlFor="new-teacher-password" className={label}>STARTING PASSWORD</label>
                <input id="new-teacher-password" type="password" autoComplete="new-password" value={draft.password} onChange={setField("password")} placeholder="At least 8 characters" className={input} />
              </div>
            </div>
            {addError && <p role="alert" className="text-sm text-red-500 mb-3">{addError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-full bg-white text-gray-600 font-medium border border-gray-200 shadow-md">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full bg-orange-400 text-white font-semibold shadow-md disabled:opacity-60">
                {saving ? "Adding..." : "Add teacher"}
              </button>
            </div>
          </form>
        )}

        {banner && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            {banner}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-gray-900">{staff.filter((s) => s.status === "Active").length}</p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-orange-500">{staff.filter((s) => s.status !== "Active").length}</p>
            <p className="text-xs text-gray-500 mt-1">Suspended</p>
          </div>
        </div>

        <div className="space-y-3">
          {staff.map((person) =>
            open?.id === person.id ? (
              open.mode === "edit" ? (
                <EditAccountForm
                  key={person.id}
                  account={{ userId: person.userId, fullName: person.name, email: person.email }}
                  onSaved={handleEdited}
                  onCancel={close}
                />
              ) : (
                <ResetPasswordForm
                  key={person.id}
                  account={{ userId: person.userId, fullName: person.name }}
                  onDone={handleReset}
                  onCancel={close}
                />
              )
            ) : (
            <div
              key={person.id}
              className={`${card} flex items-center justify-between gap-3 hover:shadow-xl hover:border-orange-300 transition`}
            >
              <div>
                <p className="font-semibold text-gray-900">{person.name}</p>
                <p className="text-xs text-gray-500">{person.role} • {groupFor(person)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                    person.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {person.status}
                </span>
                {isMasterAdmin(user) && person.role === "Teacher" && (
                  <>
                    <button
                      onClick={() => setOpen({ id: person.id, mode: "edit" })}
                      aria-label={`Edit ${person.name}`}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200 shadow-lg hover:border-orange-300 hover:shadow-xl active:scale-95 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setOpen({ id: person.id, mode: "reset" })}
                      aria-label={`Reset password for ${person.name}`}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-red-500 border border-red-200 shadow-lg hover:shadow-xl active:scale-95 transition"
                    >
                      Reset password
                    </button>
                  </>
                )}
                {person.role !== "Manager" && (
                  <button
                    onClick={() => toggle(person)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200 shadow-lg hover:border-orange-300 hover:shadow-xl active:scale-95 transition"
                  >
                    {person.status === "Active" ? "Suspend" : "Restore"}
                  </button>
                )}
              </div>
            </div>
            ),
          )}
        </div>

        {isMasterAdmin(user) && <AccountsSection />}
      </div>
    </div>
  );
}

export default Staff;