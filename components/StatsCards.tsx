type Catch = {
  id: number;
  date: string;
  location: string;
  bait: string;
  notes: string;
};

type StatsCardsProps = {
  catches: Catch[];
};

export default function StatsCards({
  catches,
}: StatsCardsProps) {
  const totalCatches = catches.length;

  const latestCatch =
    catches.length > 0 ? catches[0].location : "Ingen endnu";

  const baitCounts: Record<string, number> = {};

  catches.forEach((catchItem) => {
    baitCounts[catchItem.bait] =
      (baitCounts[catchItem.bait] || 0) + 1;
  });

  let mostUsedBait = "Ingen data";

  let highestCount = 0;

  for (const bait in baitCounts) {
    if (baitCounts[bait] > highestCount) {
      highestCount = baitCounts[bait];
      mostUsedBait = bait;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm mb-2">
          Fangster
        </p>

        <h2 className="text-3xl font-bold">
          {totalCatches}
        </h2>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm mb-2">
          Seneste spot
        </p>

        <h2 className="text-xl font-bold">
          {latestCatch}
        </h2>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm mb-2">
          Mest brugte agn
        </p>

        <h2 className="text-xl font-bold text-cyan-400">
          {mostUsedBait}
        </h2>
      </div>
    </div>
  );
}