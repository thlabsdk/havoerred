'use client';

import { useState } from 'react';
import type { Catch, CatchInsert } from '../types/catch';
import { catchSchema } from '../lib/catch-schema';

type ToastFn = (text: string, type: 'success' | 'error') => void;

type BulkOpsViewProps = {
  catches: Catch[];
  onImportCatches: (payloads: CatchInsert[]) => Promise<number>;
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

function extractCatchesArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { catches?: unknown[] }).catches)) {
    return (parsed as { catches: unknown[] }).catches;
  }
  return null;
}

export default function BulkOpsView({ catches, onImportCatches, onToast }: BulkOpsViewProps) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  function exportCatches() {
    downloadJson('havorredloggen-export.json', {
      exportDate: new Date().toISOString(),
      totalCatches: catches.length,
      catches,
    });
    onToast(`Eksporterede ${catches.length} fangster`, 'success');
  }

  async function importFromJson(raw: unknown): Promise<void> {
    const rows = extractCatchesArray(raw);
    if (!rows) {
      onToast('Ugyldigt JSON-format: forventer array af fangster', 'error');
      return;
    }

    const valid: CatchInsert[] = [];
    const failed: { index: number; issues: unknown }[] = [];

    rows.forEach((row, index) => {
      const result = catchSchema.safeParse(row);
      if (result.success) {
        valid.push(result.data);
      } else {
        failed.push({ index, issues: result.error.issues });
      }
    });

    if (failed.length > 0) {
      console.warn(`${failed.length} ugyldige fangster sprunget over:`, failed);
    }

    if (valid.length === 0) {
      onToast('Ingen gyldige fangster at importere', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const inserted = await onImportCatches(valid);
      const skippedNote = failed.length > 0 ? ` (${failed.length} sprunget over)` : '';
      onToast(`Importerede ${inserted} fangster${skippedNote}`, 'success');
    } finally {
      setIsImporting(false);
    }
  }

  function pickAndImportFile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        await importFromJson(parsed);
      } catch (err) {
        onToast(err instanceof SyntaxError ? 'Ugyldigt JSON' : 'Fejl ved import', 'error');
        console.error('File import error:', err);
      }
    };
    fileInput.click();
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
        <h2 className="text-2xl font-bold text-white mb-1">Bulk-handlinger</h2>
        <p className="text-slate-400 text-sm mb-6">
          Importér og eksportér fangster i bulk. Fremtidige bulk-handlinger lægges her.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={exportCatches}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-3 rounded-2xl transition-colors font-semibold"
          >
            Eksportér fangster ({catches.length})
          </button>

          <button
            type="button"
            onClick={pickAndImportFile}
            disabled={isImporting}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-4 py-3 rounded-2xl transition-colors font-semibold"
          >
            Importér fangster fra fil
          </button>

          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            disabled={isImporting}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-4 py-3 rounded-2xl transition-colors font-semibold"
          >
            Indsæt JSON
          </button>
        </div>
      </div>

      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">Indsæt JSON</h2>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Indsæt JSON her..."
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
