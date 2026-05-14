'use client';

import { useState } from 'react';
import type { SpotInsert } from '../types/spot';

type SpotFormProps = {
  initial?: Partial<SpotInsert>;
  onSubmit: (spot: SpotInsert) => Promise<void> | void;
  onCancel?: () => void;
  isSaving?: boolean;
  submitLabel: string;
};

export default function SpotForm({
  initial,
  onSubmit,
  onCancel,
  isSaving = false,
  submitLabel,
}: SpotFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [aliasesText, setAliasesText] = useState((initial?.aliases ?? []).join('\n'));
  const [bodyOfWater, setBodyOfWater] = useState(initial?.bodyOfWater ?? '');
  const [latitude, setLatitude] = useState<string>(
    initial?.latitude != null ? String(initial.latitude) : ''
  );
  const [longitude, setLongitude] = useState<string>(
    initial?.longitude != null ? String(initial.longitude) : ''
  );
  const [region, setRegion] = useState(initial?.region ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Navn er påkrævet');
      return;
    }

    const aliases = aliasesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsedLat = latitude.trim() === '' ? null : Number(latitude);
    const parsedLng = longitude.trim() === '' ? null : Number(longitude);
    if (parsedLat != null && !Number.isFinite(parsedLat)) {
      setError('Breddegrad er ikke et gyldigt tal');
      return;
    }
    if (parsedLng != null && !Number.isFinite(parsedLng)) {
      setError('Længdegrad er ikke et gyldigt tal');
      return;
    }

    await onSubmit({
      name: trimmedName,
      aliases,
      bodyOfWater: bodyOfWater.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      region: region.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">Navn</label>
        <input
          type="text"
          value={name}
          disabled={isSaving}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fx Frederiksværk Nordstrand"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Aliasser <span className="text-xs font-normal text-slate-500">(en pr. linje)</span>
        </label>
        <textarea
          value={aliasesText}
          disabled={isSaving}
          onChange={(e) => setAliasesText(e.target.value)}
          placeholder={'Fx Fr-værk Nord\nFrederiksværk N'}
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">Fjord / kyst</label>
        <input
          type="text"
          value={bodyOfWater}
          disabled={isSaving}
          onChange={(e) => setBodyOfWater(e.target.value)}
          placeholder="Fx Roskilde Fjord"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">Breddegrad</label>
          <input
            type="text"
            inputMode="decimal"
            value={latitude}
            disabled={isSaving}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="55.97"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">Længdegrad</label>
          <input
            type="text"
            inputMode="decimal"
            value={longitude}
            disabled={isSaving}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="12.02"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">Region</label>
        <input
          type="text"
          value={region}
          disabled={isSaving}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Fx Sjælland"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">Noter</label>
        <textarea
          value={notes}
          disabled={isSaving}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-60"
          >
            Annuller
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-bold py-2 rounded-lg transition-colors"
        >
          {isSaving ? 'Gemmer…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
