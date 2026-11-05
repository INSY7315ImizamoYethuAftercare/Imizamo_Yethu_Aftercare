import { useCallback, useEffect, useState } from "react";
import SettingsButton from "../components/SettingsButton";
import { apiClient } from "../services/apiClient";
import { useHeader } from "./UseHeader";

// How often an open queue checks for new requests: staff may be waiting at
// the door with a learner, so it shouldn't need a manual refresh.
const REFRESH_MS = 30000;

const reasonOf = (item) => (item.collectorName === null ? "Walking home — not pre-authorised" : "Unknown collector");
const detailOf = (item) =>
  item.collectorName === null
    ? "Walking Home selected. This learner doesn't have permission to walk home alone."
    : `${item.raisedBy} entered ${item.collectorName}. This name is not on the authorised pickup list.`;
// A decided request shows what happened, not why it was queued. Only an
// approved person actually collected the learner.
const outcomeOf = (item) => {
  if (item.status !== "approved") return `Requested: ${item.collectorName ?? "Walking home"}`;
  return item.collectorName === null ? "Walked home alone" : `Collected by ${item.collectorName} (not on pickup list)`;
};

// The manager's sign-out queue, from GET /api/signout/escalations. Approving
// signs the learner out on the server; dismissing leaves them at the centre.
function Escalations() {
  const { displayName, displayRole } = useHeader();
  const comingSoon = () => alert("Coming soon");
  const card = "bg-white rounded-2xl p-4 shadow-lg border border-gray-200";
  const iconBtn =
    "w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition";

  const [queue, setQueue] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [banner, setBanner] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setQueue(await apiClient.get("/signout/escalations"));
      setLoadError("");
    } catch (e) {
      setLoadError(e?.message || "Couldn't load the sign-out queue.");
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      window.removeEventListener("focus", load);
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(""), 2500);
    return () => clearTimeout(timer);
  }, [banner]);

  const resolve = async (item, action) => {
    setBusyId(item.escalationId);
    setActionError("");
    try {
      await apiClient.patch(`/signout/escalations/${item.escalationId}`, { action });
      setBanner(
        action === "approve"
          ? `${item.learnerName} — collection approved and signed out`
          : `${item.learnerName} — request dismissed`,
      );
    } catch (e) {
      setActionError(e?.message || "Couldn't save that decision. Please try again.");
    } finally {
      setBusyId(null);
      load(); // Another manager may have got there first.
    }
  };

  const openItems = queue?.open ?? [];
  const closedItems = queue?.resolved ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
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
            <SettingsButton />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-32 max-w-5xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Sign-out queue</h1>
          <p className="text-sm text-gray-500 mt-1">Collections that need a manager before the learner leaves</p>
        </div>

        {banner && (
          <div role="status" className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl px-4 py-3 text-center shadow-lg">
            {banner}
          </div>
        )}
        {loadError && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{loadError}</div>
        )}
        {actionError && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{actionError}</div>
        )}

        {!queue && !loadError && <p className="text-sm text-gray-400 text-center py-6">Loading the queue...</p>}

        {queue && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={`${card} text-center`}>
                <p className="text-2xl font-bold text-orange-500">{openItems.length}</p>
                <p className="text-xs text-gray-500 mt-1">Open</p>
              </div>
              <div className={`${card} text-center`}>
                <p className="text-2xl font-bold text-green-600">{closedItems.length}</p>
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
                <div key={item.escalationId} className={`${card} hover:shadow-xl hover:border-orange-300 transition`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{item.learnerName}</p>
                      <p className="text-xs text-gray-500">{item.className ?? "No class"} • {item.raisedBy} • {item.raisedAt}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-600 whitespace-nowrap">
                      {reasonOf(item)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{detailOf(item)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolve(item, "approve")}
                      disabled={busyId !== null}
                      className="flex-1 py-2.5 rounded-full bg-orange-400 text-white text-sm font-semibold shadow-lg hover:bg-orange-500 active:scale-[0.98] transition disabled:opacity-50"
                    >
                      Approve collection
                    </button>
                    <button
                      onClick={() => resolve(item, "dismiss")}
                      disabled={busyId !== null}
                      className="flex-1 py-2.5 rounded-full bg-white text-gray-600 text-sm font-semibold border border-gray-200 shadow-lg hover:border-orange-300 hover:shadow-xl active:scale-[0.98] transition disabled:opacity-50"
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
                    <div key={item.escalationId} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.learnerName}</p>
                        <p className="text-xs text-gray-500">{outcomeOf(item)}</p>
                      </div>
                      <p className="text-xs text-green-600 font-medium text-right">
                        {item.status === "approved" ? "Approved" : "Dismissed"} by {item.resolvedBy} • {item.resolvedAt}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Escalations;
