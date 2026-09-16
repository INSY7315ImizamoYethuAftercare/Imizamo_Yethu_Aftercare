import { useState } from "react";
import { useNavigate } from "react-router-dom";

function MoreMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 shadow-md border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
      >
        ⋮
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MoreMenu;