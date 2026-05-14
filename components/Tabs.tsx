'use client';

export type TabKey = 'catches' | 'bulk' | 'spots';

type TabsProps = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'catches', label: 'Fangster' },
  { key: 'bulk', label: 'Bulk' },
  { key: 'spots', label: 'Steder' },
];

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="mb-6 flex gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors ${
              isActive
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
