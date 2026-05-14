'use client';

import { useState } from 'react';
import type { Spot } from '../types/spot';

type SpotPickerProps = {
  spots: Spot[];
  selectedSpotId: number | null;
  onChange: (spotId: number | null, spotName: string | null) => void;
  currentLocationText: string;
  currentFjordText: string;
  onCreateSpot: (name: string, bodyOfWater: string) => Promise<Spot | null>;
  isDisabled?: boolean;
};

export default function SpotPicker({
  spots,
  selectedSpotId,
  onChange,
  currentLocationText,
  currentFjordText,
  onCreateSpot,
  isDisabled = false,
}: SpotPickerProps) {
  const [creating, setCreating] = useState(false);

  const trimmedLocation = currentLocationText.trim();
  const matchesExisting = spots.some(
    (s) => s.name === trimmedLocation || s.aliases.includes(trimmedLocation)
  );
  const canCreateFromText =
    trimmedLocation.length > 0 && !matchesExisting && selectedSpotId === null;

  const handleCreate = async () => {
    if (!trimmedLocation || creating) return;
    setCreating(true);
    try {
      const newSpot = await onCreateSpot(trimmedLocation, currentFjordText.trim());
      if (newSpot) onChange(newSpot.id, newSpot.name);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <label className="block mb-2 text-sm font-semibold text-slate-300">
        Sted (kendt spot)
      </label>

      <select
        value={selectedSpotId ?? ''}
        disabled={isDisabled}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            onChange(null, null);
            return;
          }
          const spot = spots.find((s) => s.id === Number(v));
          if (spot) onChange(spot.id, spot.name);
        }}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">— Intet sted valgt —</option>
        {spots.map((spot) => (
          <option key={spot.id} value={spot.id}>
            {spot.name}
            {spot.bodyOfWater ? ` · ${spot.bodyOfWater}` : ''}
          </option>
        ))}
      </select>

      {canCreateFromText && (
        <button
          type="button"
          onClick={handleCreate}
          disabled={isDisabled || creating}
          className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          {creating ? 'Opretter…' : `+ Opret nyt sted: "${trimmedLocation}"`}
        </button>
      )}
    </div>
  );
}
