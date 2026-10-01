import { Suspense } from 'react'

// Placeholder shell — real routing (React Router) and role-based
// screens (Teacher / Manager / Admin / Guardian) land in later tasks
// (Epics D-H on the board). This just proves the client/server/Tailwind
// wiring works end-to-end.
function App() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading...</p>}>
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Imizamo Yethu Aftercare
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Client scaffold is up. Tailwind and the API proxy are wired in.
          </p>
        </div>
      </main>
    </Suspense>
  )
}

export default App
