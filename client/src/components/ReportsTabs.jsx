function ReportsTabs({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-lg border border-gray-200 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-[72px] py-2.5 px-2 rounded-xl text-xs font-semibold transition active:scale-[0.97] flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-orange-400 text-white shadow-md"
              : "text-gray-500 hover:bg-orange-50 hover:text-orange-500"
          }`}
        >
          <span className="hidden sm:inline">{tab.icon}</span>
          {tab.id}
        </button>
      ))}
    </div>
  );
}

export default ReportsTabs;