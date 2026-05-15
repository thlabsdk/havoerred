'use client';

import { useState } from 'react';
import CatchCard from './CatchCard';
import CatchForm from './CatchForm';
import StatsCards from './StatsCards';
import type { Catch, CatchInsert, CatchUpdate } from '../types/catch';
import type { Spot } from '../types/spot';
import { type CatchFormData } from '../lib/catch-schema';

type ToastFn = (text: string, type: 'success' | 'error') => void;

type CatchesViewProps = {
  catches: Catch[];
  spots: Spot[];
  onInsertCatch: (payload: CatchInsert) => Promise<Catch | null>;
  onUpdateCatch: (id: number, payload: CatchUpdate) => Promise<Catch | null>;
  onDeleteCatch: (id: number) => Promise<boolean>;
  onCreateSpot: (name: string, bodyOfWater: string) => Promise<Spot | null>;
  onToast: ToastFn;
};

export default function CatchesView({
  catches,
  spots,
  onInsertCatch,
  onUpdateCatch,
  onDeleteCatch,
  onCreateSpot,
  onToast,
}: CatchesViewProps) {
  const [date, setDate] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [location, setLocation] = useState('');
  const [fjord, setFjord] = useState('');
  const [bait, setBait] = useState('');
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [undersized, setUndersized] = useState(false);
  const [notes, setNotes] = useState('');
  const [spotId, setSpotId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState('');

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiParsedResult, setAiParsedResult] = useState<CatchFormData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  function resetForm() {
    setDate('');
    setTimeOfDay('');
    setLocation('');
    setFjord('');
    setBait('');
    setLengthCm(null);
    setUndersized(false);
    setNotes('');
    setSpotId(null);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      date,
      timeOfDay,
      location,
      fjord,
      bait,
      lengthCm,
      undersized,
      notes,
      spotId,
    };

    try {
      if (editingId !== null) {
        const updated = await onUpdateCatch(editingId, payload);
        if (updated) resetForm();
      } else {
        const inserted = await onInsertCatch(payload);
        if (inserted) resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  }

  function editCatch(catchItem: Catch) {
    setEditingId(catchItem.id);
    setDate(catchItem.date);
    setTimeOfDay(catchItem.timeOfDay);
    setLocation(catchItem.location);
    setFjord(catchItem.fjord);
    setBait(catchItem.bait);
    setLengthCm(catchItem.lengthCm);
    setUndersized(catchItem.undersized);
    setNotes(catchItem.notes);
    setSpotId(catchItem.spotId);
  }

  async function deleteCatch(id: number) {
    setDeletingId(id);
    try {
      await onDeleteCatch(id);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAiParse() {
    if (!aiDescription.trim()) {
      onToast('Please enter a catch description', 'error');
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch('/api/parse-catch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription }),
      });

      const responseText = await response.text();
      let responseBody: unknown = responseText;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        // keep raw text
      }

      if (!response.ok) {
        const errorMessage =
          typeof responseBody === 'object' && responseBody !== null && 'error' in responseBody
            ? (responseBody as { error?: string }).error || 'Failed to parse catch'
            : 'Failed to parse catch';
        onToast(errorMessage, 'error');
        console.error('AI parse error:', {
          status: response.status,
          statusText: response.statusText,
          responseBody,
        });
        return;
      }

      if (typeof responseBody === 'string') {
        onToast('AI returned invalid JSON', 'error');
        return;
      }

      setAiParsedResult(responseBody as CatchFormData);
    } catch (err) {
      onToast('Error connecting to AI service', 'error');
      console.error('Error calling parse-catch API:', err);
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult() {
    if (!aiParsedResult) return;
    setDate(aiParsedResult.date || '');
    setTimeOfDay(aiParsedResult.timeOfDay || '');
    setLocation(aiParsedResult.location || '');
    setFjord(aiParsedResult.fjord || '');
    setBait(aiParsedResult.bait || '');
    setLengthCm(aiParsedResult.lengthCm || null);
    setUndersized(aiParsedResult.undersized || false);
    setNotes(aiParsedResult.notes || '');
    setSpotId(aiParsedResult.spotId ?? null);

    setAiParsedResult(null);
    setAiDescription('');
    setShowAiModal(false);
    onToast('Catch suggestion applied to form', 'success');
  }

  const filteredCatches = catches.filter((catchItem) => {
    const searchLower = search.toLowerCase();
    return (
      catchItem.location.toLowerCase().includes(searchLower) ||
      catchItem.bait.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <StatsCards catches={catches} />

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søg efter sted eller agn..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAiModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-2xl transition-colors font-semibold"
        >
          AI-fortolk fangst
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 mb-8">
        <h1 className="text-4xl font-bold mb-2">Havørredloggen</h1>
        <p className="text-slate-400 mb-8">Registrér dine fangster i fjorden</p>

        <CatchForm
          date={date}
          setDate={setDate}
          timeOfDay={timeOfDay}
          setTimeOfDay={setTimeOfDay}
          location={location}
          setLocation={setLocation}
          fjord={fjord}
          setFjord={setFjord}
          bait={bait}
          setBait={setBait}
          lengthCm={lengthCm}
          setLengthCm={setLengthCm}
          undersized={undersized}
          setUndersized={setUndersized}
          notes={notes}
          setNotes={setNotes}
          spotId={spotId}
          setSpotId={setSpotId}
          spots={spots}
          onCreateSpot={onCreateSpot}
          onSubmit={handleSubmit}
          isEditing={editingId !== null}
          isSaving={isSaving}
          isDisabled={isSaving}
        />
      </div>

      <div className="space-y-4">
        {filteredCatches.map((catchItem) => (
          <CatchCard
            key={catchItem.id}
            catchItem={catchItem}
            onDelete={deleteCatch}
            onEdit={editCatch}
            isDeleting={deletingId === catchItem.id}
          />
        ))}
      </div>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">AI-fortolk fangst</h2>

            {!aiParsedResult ? (
              <>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Beskriv din fangst på dansk... fx: 'Fiskedag ved Kyndby i Roskilde Fjord. Brugte spinne som agn. En smuk sølvørred på omkring 65 cm.'"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                  rows={6}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAiModal(false);
                      setAiDescription('');
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                  >
                    Annuller
                  </button>
                  <button
                    onClick={handleAiParse}
                    disabled={aiLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
                  >
                    {aiLoading ? 'Fortolker...' : 'Fortolk'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-bold mb-3 text-cyan-400">Parsed Result</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    {aiParsedResult.date && (
                      <div><span className="font-semibold text-white">Dato:</span> {aiParsedResult.date}</div>
                    )}
                    {aiParsedResult.timeOfDay && (
                      <div><span className="font-semibold text-white">Tidspunkt:</span> {aiParsedResult.timeOfDay}</div>
                    )}
                    {aiParsedResult.location && (
                      <div><span className="font-semibold text-white">Sted:</span> {aiParsedResult.location}</div>
                    )}
                    {aiParsedResult.fjord && (
                      <div><span className="font-semibold text-white">Fjord:</span> {aiParsedResult.fjord}</div>
                    )}
                    {aiParsedResult.bait && (
                      <div><span className="font-semibold text-white">Agn:</span> {aiParsedResult.bait}</div>
                    )}
                    {aiParsedResult.lengthCm && (
                      <div><span className="font-semibold text-white">Længde:</span> {aiParsedResult.lengthCm} cm</div>
                    )}
                    {aiParsedResult.undersized && (
                      <div><span className="font-semibold text-white">Undersized:</span> Ja</div>
                    )}
                    {aiParsedResult.notes && (
                      <div><span className="font-semibold text-white">Noter:</span> {aiParsedResult.notes}</div>
                    )}
                    {aiParsedResult.spotId != null && (
                      <div><span className="font-semibold text-white">Spot id:</span> {aiParsedResult.spotId}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAiParsedResult(null);
                      setAiDescription('');
                      setShowAiModal(false);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                  >
                    Luk
                  </button>
                  <button
                    onClick={applyAiResult}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg transition-colors font-semibold"
                  >
                    Anvend
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
