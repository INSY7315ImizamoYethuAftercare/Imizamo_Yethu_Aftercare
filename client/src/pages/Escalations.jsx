import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";
import { useHeader } from "./UseHeader";

function Escalations() {
  const { displayName, displayRole } = useHeader();
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const [items, setItems] = useState([
    {
      id: 1,
      learner: "Zoe Ntombela",
      group: "Red",
      reason: "Unknown collector",
      detail: "Teacher entered Thabo Mokoena. Name is not on the authorised list.",
      teacher: "Ms Williams",
      time: "17:42",
      status: "open",
    },
    {
      id: 2,
      learner: "Sipho Dlamini",
      group: "Blue",
      reason: "Walking home — not pre-authorised",
      detail: "Walking Home selected. Parent record does not allow unaccompanied departure.",
      teacher: "Mr Naidoo",
      time: "17:20",
      status: "open",
    },
    {
      id: 3,
      learner: "Liam van der Berg",
      group: "Green",
      reason: "Name mismatch",
      detail: "Collector typed Johan van der Berg. Authorised list has Johan van der Bergh.",
      teacher: "Mr Dlamini",
      time: "16:55",
      status: "open",
    },
  ]);

  const [banner, setBanner] = useState("");
  const openItems = items.filter((i) => i.status === "open");
  const closedItems = items.filter((i) => i.status !== "open");

  const resolve = (id, action) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: action, resolvedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          : i
      )
    );
    const row = items.find((i) => i.id === id);
    setBanner(
      action === "resolved"
        ? row.learner + " — collection approved by manager"
        : row.learner + " — escalation dismissed"
    );
    setTimeout(() => setBanner(""), 2500);
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
          <div className="flex items-center gap-3">
            <button onClick={comingSoon} className={iconBtn}>🔔</button>
            <button onClick={() => navigate("/settings")} className={iconBtn}>⚙️</button>
            <MoreMenu />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Sign-out queue</h1>
          <p className="text-sm text-gray-500 mt-1">Collections that need a manager before the learner leaves</p>
        </div>

        {banner && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            {banner}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-orange-500">{openItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Open</p>
          </div>
          <div className={`${card} text-center`}>
            <p className="text-2xl font-bold text-green-500">{closedItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Resolved today</p>
          </div>
        </div>

        {openItems.length === 0 && (
          <div className={`${card} text-center text-sm text-gray-500 mb-5`}>
            No open escalations. All collections are clear.
          </div>
        )}

        <div className="space-y-3 mb-8">
          {openItems.map((item) => (
            <div key={item.id} className={`${card} hover:shadow-xl hover:border-orange-300 transition`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{item.learner}</p>
                  <p className="text-xs text-gray-500">{item.group} • {item.teacher} • {item.time}</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-600 whitespace-nowrap">
                  {item.reason}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{item.detail}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => resolve(item.id, "resolved")}
                  className="flex-1 py-2.5 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition"
                >
                  Approve collection
                </button>
                <button
                  onClick={() => resolve(item.id, "dismissed")}
                  className="flex-1 py-2.5 rounded-full bg-white text-gray-600 text-sm font-semibold border border-gray-200 shadow-lg hover:border-orange-300 hover:shadow-xl active:scale-[0.98] transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>

        {closedItems.length > 0 && (
          <>
            <p className="text-xs font-medium text-gray-400 mb-3 tracking-wide">RESOLVED TODAY</p>
            <div className="space-y-2">
              {closedItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.learner}</p>
                    <p className="text-xs text-gray-500">{item.reason}</p>
                  </div>
                  <p className="text-xs text-green-600 font-medium">
                    {item.status === "resolved" ? "Approved" : "Dismissed"} • {item.resolvedAt}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Escalations;