'use client';

import type { Spot } from '../types/spot';

type SpotCardProps = {
  spot: Spot;
  onEdit: (spot: Spot) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
};

export default function SpotCard({ spot, onEdit, onDelete, isDeleting = false }: SpotCardProps) {
  const hasCoords = spot.latitude != null && spot.longitude != null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-lg font-bold text-white truncate">{spot.name}</h3>
          {spot.bodyOfWater && (
            <span className="text-sm text-cyan-400">· {spot.bodyOfWater}</span>
          )}
        </div>

        {spot.aliases.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            Aliasser: {spot.aliases.join(', ')}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          {spot.region && <span>{spot.region}</span>}
          {hasCoords && (
            <span>
              {spot.latitude!.toFixed(4)}, {spot.longitude!.toFixed(4)}
            </span>
          )}
          {!hasCoords && <span className="text-amber-500">Ingen koordinater</span>}
        </div>

        {spot.notes && <p className="mt-2 text-sm text-slate-300">{spot.notes}</p>}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(spot)}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm font-semibold"
        >
          Rediger
        </button>
        <button
          type="button"
          onClick={() => onDelete(spot.id)}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white px-3 py-1 rounded-lg text-sm font-semibold disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Sletter…' : 'Slet'}
        </button>
      </div>
    </div>
  );
}
