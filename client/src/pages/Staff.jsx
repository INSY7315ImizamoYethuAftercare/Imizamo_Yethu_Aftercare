import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoreMenu from "../components/MoreMenu";

function Staff() {
  const navigate = useNavigate();
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";
  const [banner, setBanner] = useState("");
  const [staff, setStaff] = useState([
    { id: 1, name: "Ms Nkosi", role: "Teacher", group: "Yellow", status: "Active" },
    { id: 2, name: "Mr Dlamini", role: "Teacher", group: "Green", status: "Active" },
    { id: 3, name: "Ms Williams", role: "Teacher", group: "Red", status: "Active" },
    { id: 4, name: "Mr Naidoo", role: "Teacher", group: "Blue", status: "Active" },
    { id: 5, name: "Sarah Botha", role: "Manager", group: "All classes", status: "Active" },
  ]);

  const toggle = (id) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = s.status === "Active" ? "Suspended" : "Active";
        setBanner(s.name + " is now " + next.toLowerCase());
        setTimeout(() => setBanner(""), 2200);
        return { ...s, status: next };
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-orange-500">Sarah Botha</p>
              <p className="text-xs text-gray-500">Manager</p>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff oversight</h1>
        <p className="text-sm text-gray-500 mb-4">Teachers and managers linked to this hub</p>

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
          {staff.map((person) => (
            <div
              key={person.id}
              className={`${card} flex items-center justify-between gap-3 hover:shadow-xl hover:border-orange-300 transition`}
            >
              <div>
                <p className="font-semibold text-gray-900">{person.name}</p>
                <p className="text-xs text-gray-500">{person.role} • {person.group}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                    person.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {person.status}
                </span>
                {person.role !== "Manager" && (
                  <button
                    onClick={() => toggle(person.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200 shadow-lg hover:border-orange-300 hover:shadow-xl active:scale-95 transition"
                  >
                    {person.status === "Active" ? "Suspend" : "Restore"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Staff;