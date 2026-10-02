import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { useClasses } from "./UseClasses";
import { useLearners, useLearnersLoading, addLearner, deleteLearner, setLearnerStatus } from "./UseLearners";
import AddLearnerSheet from "./AddLearnerSheet";
import { useHeader } from "./UseHeader";

function Learners({ role = "Teacher" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const comingSoon = () => alert("Coming soon");
  const settingsPath = role === "Admin" ? "/admin/settings" : "/settings";
  const showSettings = role === "Manager" || role === "Admin";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const { displayName, displayRole } = useHeader();

  const observationsPath =
    role === "Admin" ? "/admin/observations" :
    role === "Manager" ? "/manager/observations" : "/observations";

  const startGroup = searchParams.get("group") || "All";
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState(startGroup);

  const learners = useLearners();
  const loadingLearners = useLearnersLoading();
  const isManager = role === "Manager";
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState(null); // { type: "delete" | "deactivate" | "reactivate", learner }

  const allClasses = useClasses();
  const classes = ["All", ...allClasses.map((c) => c.name)];

  const filtered = learners.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "All" || l.group === selectedClass;
    return matchesSearch && matchesClass;
  });

  const shell = role === "Teacher" ? "max-w-lg mx-auto w-full" : "max-w-5xl mx-auto w-full";

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-orange-500">{displayName}</p>
            <p className="text-xs text-gray-500">{displayRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={comingSoon} className={iconBtn}>🔔</button>
          {showSettings && (
            <button onClick={() => navigate(settingsPath)} className={iconBtn}>⚙️</button>
          )}
          <MoreMenu />
        </div>
      </div>

      <div className={`flex-1 px-4 pt-5 pb-32 ${shell}`}>
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Learners <span>🎒</span></h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} learner{filtered.length === 1 ? "" : "s"} enrolled</p>
          </div>
          {isManager && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-orange-600 active:scale-95 transition"
            >
              + Add
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search learner name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-4 mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <div className="flex gap-2 mb-5 overflow-x-auto py-2">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-md border transition active:scale-95 ${
                selectedClass === cls
                  ? "bg-orange-400 text-white border-orange-400"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {loadingLearners && learners.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Loading learners...</p>
        )}

        <div className="space-y-3">
          {filtered.map((learner) => (
            <button
              key={learner.id}
              onClick={() => navigate(`${observationsPath}?id=${learner.id}`)}
              className="w-full bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200 text-left hover:border-orange-300 active:scale-[0.98] transition"
            >
              <div>
                <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-xs text-gray-500">{learner.grade} • {learner.group}</p>
              </div>
            );
          })}
        </div>
      </div>
      {isManager && showAdd && (
        <AddLearnerSheet
          onAdd={(l) => { addLearner(l); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {isManager && pending && (() => {
        const copy = {
          delete: {
            title: "Delete Learner?",
            body: "This permanently deletes the learner. They will no longer appear on any teacher's list.",
            button: "🗑 Delete",
            tint: "bg-red-50 border-red-100",
            act: () => deleteLearner(pending.learner.id),
          },
          deactivate: {
            title: "Deactivate Learner?",
            body: "The learner will still show on the teachers' list, but greyed out and unable to be opened until you reactivate them.",
            button: "Deactivate",
            tint: "bg-orange-50 border-orange-100",
            act: () => setLearnerStatus(pending.learner.id, "deactivated"),
          },
          reactivate: {
            title: "Reactivate Learner?",
            body: "The learner will be accessible to teachers again.",
            button: "Reactivate",
            tint: "bg-orange-50 border-orange-100",
            act: () => setLearnerStatus(pending.learner.id, "active"),
          },
        }[pending.type];
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setPending(null)}>
            <div className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h2 className="text-lg font-bold text-gray-900 text-center">{copy.title}</h2>
              <div className={`border rounded-2xl px-4 py-3 my-4 ${copy.tint}`}>
                <p className="text-sm font-semibold text-gray-900">{pending.learner.name}</p>
                <p className="text-xs text-gray-500">{pending.learner.grade} • {pending.learner.group}</p>
              </div>
              <p className="text-sm text-gray-500 text-center mb-5">{copy.body}</p>
              <div className="flex gap-3">
                <button onClick={() => setPending(null)} className="flex-1 py-3 rounded-xl bg-[#F5F0EA] text-sm font-semibold text-gray-500 active:scale-95 transition">Cancel</button>
                <button
                  onClick={() => { copy.act(); setPending(null); }}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md active:scale-95 transition"
                >
                  {copy.button}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Learners;