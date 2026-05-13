import { Catch } from "../types/catch";

type CatchCardProps = {
  catchItem: Catch;
  onDelete: (id: number) => void;
  onEdit: (catchItem: Catch) => void;
  isDeleting?: boolean;
};

export default function CatchCard({
  catchItem,
  onDelete,
  onEdit,
  isDeleting = false,
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

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onEdit(catchItem)}
          disabled={isDeleting}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 px-4 py-2 rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
        >
          Redigér
        </button>

        <button
          onClick={() => onDelete(catchItem.id)}
          disabled={isDeleting}
          className="bg-red-500 hover:bg-red-400 disabled:bg-slate-700 disabled:text-slate-400 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isDeleting ? "Sletter..." : "Slet"}
        </button>
      </div>
    </div>
  );
}