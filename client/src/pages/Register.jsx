import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiClient } from "../services/apiClient";

// Parent/guardian self-registration (POST /api/auth/register). Staff accounts
// are never created here: a manager adds teachers on the Staff page, so the
// hub controls who gets staff access.
//
// The server links the new account to a learner by matching the child's name
// and date of birth exactly, and adds the parent to that child's pickup list.

const RELATIONSHIPS = ["Mother", "Father", "Grandmother", "Grandfather", "Aunt", "Uncle", "Legal guardian", "Other"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
  relationship: "",
  childName: "",
  childDob: "",
  password: "",
  confirm: "",
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm shadow-sm";
  const label = "text-xs font-medium text-gray-500 mb-1 block";
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Same rules as the server, so most mistakes are caught before sending.
  const problem = () => {
    const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
    if (Object.entries(f).some(([k, v]) => k !== "confirm" && !v)) return "Please fill in every field.";
    if (!EMAIL.test(f.email)) return "Please enter a valid email address.";
    if (form.password.length < 8) return "Your password must be at least 8 characters.";
    if (form.password !== form.confirm) return "The two passwords don't match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const message = problem();
    if (message) return setError(message);
    setBusy(true);
    setError("");
    try {
      await apiClient.post("/auth/register", {
        email: form.email.trim(),
        password: form.password,
        role: "guardian",
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        contactNumber: form.contactNumber.trim(),
        relationship: form.relationship,
        claimedLearnerName: form.childName.trim(),
        claimedLearnerDob: form.childDob,
      });
      navigate("/", { replace: true, state: { message: "Account created. Please sign in." } });
    } catch (err) {
      setError(
        err.status === 404
          ? "We couldn't find a learner with that name and date of birth. Check the spelling and date, or ask the centre."
          : err.message || "Could not create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-3 bg-white rounded-2xl shadow-md flex items-center justify-center p-2.5">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
        <p className="text-sm text-purple-500 mt-1">Imizamo Yethu Learning Hub</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full mb-2 w-fit">
          <span>💛</span>
          <div>
            <p className="text-sm font-medium text-orange-600">Parent / Guardian</p>
            <p className="text-[10px] text-orange-400">View your child’s progress</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-5">Staff accounts are created by the manager.</p>

        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-first" className={label}>FIRST NAME</label>
              <input id="reg-first" autoComplete="given-name" placeholder="Fatima" value={form.firstName} onChange={set("firstName")} className={input} />
            </div>
            <div>
              <label htmlFor="reg-last" className={label}>LAST NAME</label>
              <input id="reg-last" autoComplete="family-name" placeholder="Petersen" value={form.lastName} onChange={set("lastName")} className={input} />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className={label}>EMAIL ADDRESS</label>
            <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} className={input} />
          </div>

          <div>
            <label htmlFor="reg-phone" className={label}>PHONE NUMBER</label>
            <input id="reg-phone" type="tel" autoComplete="tel" placeholder="082 123 4567" value={form.contactNumber} onChange={set("contactNumber")} className={input} />
          </div>

          <div>
            <label htmlFor="reg-relationship" className={label}>RELATIONSHIP TO YOUR CHILD</label>
            <select id="reg-relationship" value={form.relationship} onChange={set("relationship")} className={`${input} bg-white`}>
              <option value="">Choose…</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg-child" className={label}>YOUR CHILD’S FULL NAME</label>
            <input id="reg-child" placeholder="e.g. Aisha Petersen" value={form.childName} onChange={set("childName")} className={input} />
          </div>

          <div>
            <label htmlFor="reg-child-dob" className={label}>YOUR CHILD’S DATE OF BIRTH</label>
            <input id="reg-child-dob" type="date" value={form.childDob} onChange={set("childDob")} className={input} />
            <p className="text-xs text-gray-400 mt-1">We use your child’s name and date of birth to link your account to them.</p>
          </div>

          <div>
            <label htmlFor="reg-password" className={label}>PASSWORD</label>
            <input id="reg-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} className={input} />
          </div>

          <div>
            <label htmlFor="reg-confirm" className={label}>CONFIRM PASSWORD</label>
            <input id="reg-confirm" type="password" autoComplete="new-password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} className={input} />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-center text-red-500 mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-full bg-orange-400 text-white font-semibold text-base shadow-md hover:bg-orange-500 active:scale-[0.98] transition mb-3 disabled:opacity-60"
        >
          {busy ? "Creating account..." : "Create Account"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-center text-sm text-gray-500 font-medium active:scale-95 transition"
        >
          ← Back to Sign In
        </button>
      </form>
    </div>
  );
}

export default Register;
