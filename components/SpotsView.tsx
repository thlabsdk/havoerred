'use client';

import { useState } from 'react';
import SpotForm from './SpotForm';
import SpotCard from './SpotCard';
import type { Spot, SpotInsert, SpotUpdate } from '../types/spot';
import { spotSchema } from '../lib/spot-schema';

type ToastFn = (text: string, type: 'success' | 'error') => void;

type SpotsViewProps = {
  spots: Spot[];
  onCreateSpot: (payload: SpotInsert) => Promise<Spot | null>;
  onUpdateSpot: (id: number, payload: SpotUpdate) => Promise<Spot | null>;
  onDeleteSpot: (id: number) => Promise<boolean>;
  onImportSpots: (payloads: SpotInsert[]) => Promise<number>;
  onToast: ToastFn;
};

function downloadJson(filename: string, payload: unknown) {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function extractSpotsArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { spots?: unknown[] }).spots)) {
    return (parsed as { spots: unknown[] }).spots;
  }
  return null;
}

export default function SpotsView({
  spots,
  onCreateSpot,
  onUpdateSpot,
  onDeleteSpot,
  onImportSpots,
  onToast,
}: SpotsViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  async function handleCreate(payload: SpotInsert) {
    setIsSaving(true);
    try {
      const created = await onCreateSpot(payload);
      if (created) {
        setShowCreateForm(false);
        onToast(`Sted "${created.name}" oprettet`, 'success');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(payload: SpotInsert) {
    if (!editingSpot) return;
    setIsSaving(true);
    try {
      const updated = await onUpdateSpot(editingSpot.id, payload);
      if (updated) {
        setEditingSpot(null);
        onToast(`Sted "${updated.name}" opdateret`, 'success');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    try {
      const ok = await onDeleteSpot(id);
      if (ok) onToast('Sted slettet', 'success');
    } finally {
      setDeletingId(null);
    }
  }

  function exportSpots() {
    downloadJson('havorredloggen-spots-export.json', {
      exportDate: new Date().toISOString(),
      totalSpots: spots.length,
      spots,
    });
    onToast(`Eksporterede ${spots.length} steder`, 'success');
  }

  async function importFromJson(raw: unknown): Promise<void> {
    const rows = extractSpotsArray(raw);
    if (!rows) {
      onToast('Ugyldigt JSON-format: forventer array af steder', 'error');
      return;
    }

    const valid: SpotInsert[] = [];
    const failed: { index: number; issues: unknown }[] = [];

    rows.forEach((row, index) => {
      const result = spotSchema.safeParse(row);
      if (result.success) {
        valid.push(result.data);
      } else {
        failed.push({ index, issues: result.error.issues });
      }
    });

    if (failed.length > 0) {
      console.warn(`${failed.length} ugyldige steder sprunget over:`, failed);
    }

    if (valid.length === 0) {
      onToast('Ingen gyldige steder at importere', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const inserted = await onImportSpots(valid);
      const skippedNote = failed.length > 0 ? ` (${failed.length} sprunget over)` : '';
      onToast(`Importerede ${inserted} steder${skippedNote}`, 'success');
    } finally {
      setIsImporting(false);
    }
  }

  async function handlePasteImport() {
    try {
      const parsed = JSON.parse(pasteText);
      await importFromJson(parsed);
      setPasteText('');
      setShowPasteModal(false);
    } catch (err) {
      onToast(err instanceof SyntaxError ? 'Ugyldigt JSON-format' : 'Fejl ved import', 'error');
      console.error('Paste import error:', err);
    }
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-1 gap-4">
          <h2 className="text-2xl font-bold text-white">Steder</h2>
          <span className="text-sm text-slate-400">{spots.length} registreret</span>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Kendte fiskespots. Bruges som kanoniske referencer for fangster og af AI-fortolkningen.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            {showCreateForm ? 'Skjul' : '+ Nyt sted'}
          </button>
          <button
            type="button"
            onClick={exportSpots}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            Eksportér ({spots.length})
          </button>
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            disabled={isImporting}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            Indsæt JSON
          </button>
        </div>

        {showCreateForm && (
          <div className="mt-6 border-t border-slate-800 pt-6">
            <SpotForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isSaving={isSaving}
              submitLabel="Opret sted"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {spots.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Ingen steder endnu. Opret det første.</p>
        ) : (
          spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              onEdit={setEditingSpot}
              onDelete={(id) => setPendingDeleteId(id)}
              isDeleting={deletingId === spot.id}
            />
          ))
        )}
      </div>

      {editingSpot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">Rediger sted</h2>
            <SpotForm
              initial={{
                name: editingSpot.name,
                aliases: editingSpot.aliases,
                bodyOfWater: editingSpot.bodyOfWater,
                latitude: editingSpot.latitude,
                longitude: editingSpot.longitude,
                region: editingSpot.region,
                notes: editingSpot.notes,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingSpot(null)}
              isSaving={isSaving}
              submitLabel="Gem ændringer"
            />
          </div>
        </div>
      )}

      {pendingDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2 text-white">Slet sted?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Tilhørende fangster mister deres link til dette sted, men forbliver registreret med fritekst-stedet.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Slet
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">Indsæt steder (JSON)</h2>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Indsæt JSON-array eller objekt med 'spots'..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
              rows={10}
            />
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={handlePasteImport}
                disabled={isImporting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Importér
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
