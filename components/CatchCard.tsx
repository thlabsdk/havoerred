import { Catch } from "../types/catch";

type CatchCardProps = {
  catchItem: Catch;
  onDelete: (id: number) => void;
};

export default function CatchCard({
  catchItem,
  onDelete,
}: CatchCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between mb-3">
        <h2 className="text-xl font-bold">
          {catchItem.location}
        </h2>

        <span className="text-slate-400">
          {catchItem.date}
        </span>
      </div>

      <p className="text-cyan-400 mb-2">
        {catchItem.bait}
      </p>

      <p className="text-slate-300">
        {catchItem.notes}
      </p>

      <button
        onClick={() => onDelete(catchItem.id)}
        className="mt-4 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Slet fangst
      </button>
    </div>
  );
}