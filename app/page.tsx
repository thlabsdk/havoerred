"use client";

import { useEffect, useState } from "react";

import CatchCard from "../components/CatchCard";
import CatchForm from "../components/CatchForm";
import StatsCards from "../components/StatsCards";

import {
  Catch,
  CatchFromDB,
} from "../types/catch";

import type { Spot } from "../types/spot";

import {
  mapCatchFromDb,
  toCatchInsertPayload,
  toCatchUpdatePayload,
} from "../lib/catch_mappers";

import { catchSchema, type CatchFormData } from "../lib/catch-schema";

import { fetchSpots, createSpot } from "../lib/spots_repo";

import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [fjord, setFjord] = useState("");
  const [bait, setBait] = useState("");
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [undersized, setUndersized] = useState(false);
  const [windDirection, setWindDirection] = useState("");
  const [notes, setNotes] = useState("");
  const [spotId, setSpotId] = useState<number | null>(null);

  const [spots, setSpots] = useState<Spot[]>([]);

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [catches, setCatches] = useState<
    Catch[]>([]);

  const [showJsonModal, setShowJsonModal] =
    useState(false);

  const [jsonPasteInput, setJsonPasteInput] =
    useState("");

  const [importMessage, setImportMessage] =
    useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [showAiModal, setShowAiModal] =
    useState(false);

  const [aiDescription, setAiDescription] =
    useState("");

  const [aiParsedResult, setAiParsedResult] =
    useState<CatchFormData | null>(null);

  const [aiLoading, setAiLoading] =
    useState(false);

  const formatSupabaseError = (error: unknown) => {
    if (!error || typeof error !== "object") {
      return error;
    }

    if ("message" in error) {
      return (error as { message?: string }).message ?? error;
    }

    return error;
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [catchesResult, spotsResult] = await Promise.allSettled([
          supabase
            .from("catches")
            .select("*")
            .order("created_at", { ascending: false }),
          fetchSpots(),
        ]);

        if (catchesResult.status === 'fulfilled') {
          const { data, error } = catchesResult.value;
          if (error) {
            console.error("Failed to load catches:", formatSupabaseError(error));
          } else if (data) {
            setCatches((data as CatchFromDB[]).map(mapCatchFromDb));
          }
        } else {
          console.error("Failed to load catches:", catchesResult.reason);
        }

        if (spotsResult.status === 'fulfilled') {
          setSpots(spotsResult.value);
        } else {
          console.error("Failed to load spots:", spotsResult.reason);
        }
      } finally {
        setHydrated(true);
      }
    }

    loadInitialData();
  }, []);

  async function handleCreateSpot(name: string, bodyOfWater: string): Promise<Spot | null> {
    try {
      const newSpot = await createSpot({
        name,
        aliases: [],
        bodyOfWater,
        latitude: null,
        longitude: null,
        region: '',
        notes: '',
      });
      setSpots((prev) => [...prev, newSpot].sort((a, b) => a.name.localeCompare(b.name)));
      return newSpot;
    } catch (err) {
      console.error('Failed to create spot:', formatSupabaseError(err));
      setImportMessage({ text: 'Kunne ikke oprette sted', type: 'error' });
      return null;
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // Validate form data
    const formData = {
      date,
      location,
      fjord,
      bait,
      lengthCm,
      undersized,
      windDirection,
      notes,
      spotId,
    };

    const validation = catchSchema.safeParse(formData);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.issues);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    if (editingId !== null) {
      const updatePayload = toCatchUpdatePayload({
        date,
        location,
        fjord,
        bait,
        lengthCm,
        undersized,
        windDirection,
        notes,
        spotId,
      });

      const { data, error } = await supabase
        .from("catches")
        .update(updatePayload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        console.error(
          "Failed to update catch:",
          formatSupabaseError(error)
        );
        setIsSaving(false);
        return;
      }

      setCatches(
        catches.map((catchItem) =>
          catchItem.id === editingId
            ? mapCatchFromDb(data as CatchFromDB)
            : catchItem
        )
      );

      setEditingId(null);
    } else {
      const insertPayload = toCatchInsertPayload({
        date,
        location,
        fjord,
        bait,
        lengthCm,
        undersized,
        windDirection,
        notes,
        spotId,
      });

      const { data, error } = await supabase
        .from("catches")
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.error(
          "Failed to insert catch:",
          formatSupabaseError(error)
        );
        setIsSaving(false);
        return;
      }

      setCatches([
        mapCatchFromDb(data as CatchFromDB),
        ...catches,
      ]);
    }

    setIsSaving(false);

    setDate("");
    setLocation("");
    setFjord("");
    setBait("");
    setLengthCm(null);
    setUndersized(false);
    setWindDirection("");
    setNotes("");
    setSpotId(null);
  }

  function editCatch(catchItem: Catch) {
    setEditingId(catchItem.id);

    setDate(catchItem.date);
    setLocation(catchItem.location);
    setFjord(catchItem.fjord);
    setBait(catchItem.bait);
    setLengthCm(catchItem.lengthCm);
    setUndersized(catchItem.undersized);
    setWindDirection(catchItem.windDirection);
    setNotes(catchItem.notes);
    setSpotId(catchItem.spotId);
  }

  async function deleteCatch(id: number) {
    setDeletingId(id);
    
    try {
      const { error } = await supabase
        .from("catches")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "Failed to delete catch:",
          formatSupabaseError(error)
        );
        return;
      }

      setCatches(
        catches.filter(
          (catchItem) => catchItem.id !== id
        )
      );
    } finally {
      setDeletingId(null);
    }
  }
  

  const filteredCatches = catches.filter(
    (catchItem) => {
      const searchLower =
        search.toLowerCase();

      return (
        catchItem.location
          .toLowerCase()
          .includes(searchLower) ||
        catchItem.bait
          .toLowerCase()
          .includes(searchLower)
      );
    }
  );

  function exportCatches() {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCatches: catches.length,
      catches: catches,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'havorredloggen-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function importCatches() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileContent = await file.text();
        const parsedData = JSON.parse(fileContent);

        // Handle both direct array format and export format
        const catchesToImport = Array.isArray(parsedData)
          ? parsedData
          : parsedData.catches || [];

        if (!Array.isArray(catchesToImport)) {
          console.error('Invalid JSON format: expected array of catches');
          return;
        }

        const validCatches = [];
        const failedCatches = [];

        // Validate each catch
        for (let i = 0; i < catchesToImport.length; i++) {
          const catchData = catchesToImport[i];
          const validation = catchSchema.safeParse(catchData);

          if (validation.success) {
            validCatches.push(catchData);
          } else {
            failedCatches.push({
              index: i,
              data: catchData,
              errors: validation.error.issues,
            });
          }
        }

        if (failedCatches.length > 0) {
          console.warn(
            `${failedCatches.length} invalid entries skipped:`,
            failedCatches
          );
        }

        if (validCatches.length === 0) {
          console.error('No valid catches to import');
          return;
        }

        // Insert valid catches into Supabase
        const insertPayloads = validCatches.map(
          toCatchInsertPayload
        );

        const { data, error } = await supabase
          .from('catches')
          .insert(insertPayloads)
          .select();

        if (error) {
          console.error('Failed to import catches:', formatSupabaseError(error));
          return;
        }

        if (data) {
          const newCatches = (data as CatchFromDB[]).map(mapCatchFromDb);
          setCatches([...newCatches, ...catches]);
          console.log(`Successfully imported ${newCatches.length} catches`);
        }
      } catch (err) {
        console.error('Error importing catches:', err);
      }
    };

    fileInput.click();
  }

  async function handleJsonPasteImport() {
    try {
      const parsedData = JSON.parse(jsonPasteInput);

      // Handle both direct array format and export format
      const catchesToImport = Array.isArray(parsedData)
        ? parsedData
        : parsedData.catches || [];

      if (!Array.isArray(catchesToImport)) {
        setImportMessage({
          text: 'Invalid JSON format: expected array of catches',
          type: 'error',
        });
        return;
      }

      const validCatches = [];
      const failedCatches = [];

      // Validate each catch
      for (let i = 0; i < catchesToImport.length; i++) {
        const catchData = catchesToImport[i];
        const validation = catchSchema.safeParse(catchData);

        if (validation.success) {
          validCatches.push(catchData);
        } else {
          failedCatches.push({
            index: i,
            data: catchData,
            errors: validation.error.issues,
          });
        }
      }

      if (failedCatches.length > 0) {
        console.warn(
          `${failedCatches.length} invalid entries skipped:`,
          failedCatches
        );
      }

      if (validCatches.length === 0) {
        setImportMessage({
          text: 'No valid catches to import',
          type: 'error',
        });
        return;
      }

      // Insert valid catches into Supabase
      const insertPayloads = validCatches.map(
        toCatchInsertPayload
      );

      const { data, error } = await supabase
        .from('catches')
        .insert(insertPayloads)
        .select();

      if (error) {
        setImportMessage({
          text: 'Failed to import catches',
          type: 'error',
        });
        console.error('Failed to import catches:', formatSupabaseError(error));
        return;
      }

      if (data) {
        const newCatches = (data as CatchFromDB[]).map(mapCatchFromDb);
        setCatches([...newCatches, ...catches]);
        setImportMessage({
          text: `Successfully imported ${newCatches.length} catches`,
          type: 'success',
        });
        setJsonPasteInput("");
        setShowJsonModal(false);

        // Clear message after 3 seconds
        setTimeout(() => {
          setImportMessage(null);
        }, 3000);
      }
    } catch (err) {
      setImportMessage({
        text: err instanceof SyntaxError ? 'Invalid JSON format' : 'Error importing catches',
        type: 'error',
      });
      console.error('Error importing catches:', err);
    }
  }

  async function handleAiParse() {
    if (!aiDescription.trim()) {
      setImportMessage({
        text: 'Please enter a catch description',
        type: 'error',
      });
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
        // Keep the raw text when the response is not valid JSON.
      }

      if (!response.ok) {
        const errorBody = typeof responseBody === 'string'
          ? responseBody
          : JSON.stringify(responseBody, null, 2);

        const errorMessage =
          typeof responseBody === 'object' && responseBody !== null && 'error' in responseBody
            ? (responseBody as { error?: string }).error || 'Failed to parse catch'
            : 'Failed to parse catch';

        setImportMessage({
          text: errorMessage,
          type: 'error',
        });

        console.error('AI parse error:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorBody,
          requestBody: { description: aiDescription },
        });
        return;
      }

      if (typeof responseBody === 'string') {
        try {
          responseBody = JSON.parse(responseBody);
        } catch (parseError) {
          console.error('AI parse error: non-JSON success response', {
            status: response.status,
            statusText: response.statusText,
            responseText,
            parseError: String(parseError),
          });
          setImportMessage({
            text: 'AI returned invalid JSON',
            type: 'error',
          });
          return;
        }
      }

      console.log('AI parse success:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: JSON.stringify(responseBody, null, 2),
      });

      setAiParsedResult(responseBody as CatchFormData);
    } catch (err) {
      setImportMessage({
        text: 'Error connecting to AI service',
        type: 'error',
      });
      console.error('Error calling parse-catch API:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult() {
    if (!aiParsedResult) return;

    setDate(aiParsedResult.date || '');
    setLocation(aiParsedResult.location || '');
    setFjord(aiParsedResult.fjord || '');
    setBait(aiParsedResult.bait || '');
    setLengthCm(aiParsedResult.lengthCm || null);
    setUndersized(aiParsedResult.undersized || false);
    setWindDirection(aiParsedResult.windDirection || '');
    setNotes(aiParsedResult.notes || '');
    setSpotId(aiParsedResult.spotId ?? null);

    setAiParsedResult(null);
    setAiDescription("");
    setShowAiModal(false);
    setImportMessage({
      text: 'Catch suggestion applied to form',
      type: 'success',
    });

    setTimeout(() => {
      setImportMessage(null);
    }, 3000);
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-20 bg-slate-900 rounded-2xl mb-6 animate-pulse" />
          <div className="h-16 bg-slate-900 rounded-2xl mb-6 animate-pulse" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 mb-8">
            <div className="h-10 bg-slate-800 rounded mb-4 animate-pulse" />
            <div className="h-32 bg-slate-800 rounded mb-6 animate-pulse" />
            <div className="h-12 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <StatsCards catches={catches} />

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Søg efter sted eller agn..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="mb-6">
          <button
            onClick={exportCatches}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-3 rounded-2xl transition-colors font-semibold"
          >
            Export fangster
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={importCatches}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-2xl transition-colors font-semibold"
          >
            Import fangster
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowJsonModal(true)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-2xl transition-colors font-semibold"
          >
            Indsæt JSON
          </button>
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
          <h1 className="text-4xl font-bold mb-2">
            Havørredloggen
          </h1>

          <p className="text-slate-400 mb-8">
            Registrér dine fangster i
            fjorden
          </p>

          <CatchForm
            date={date}
            setDate={setDate}
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
            windDirection={windDirection}
            setWindDirection={setWindDirection}
            notes={notes}
            setNotes={setNotes}
            spotId={spotId}
            setSpotId={setSpotId}
            spots={spots}
            onCreateSpot={handleCreateSpot}
            onSubmit={handleSubmit}
            isEditing={editingId !== null}
            isSaving={isSaving}
            isDisabled={isSaving}
          />
        </div>

        <div className="space-y-4">
          {filteredCatches.map(
            (catchItem) => (
              <CatchCard
                key={catchItem.id}
                catchItem={catchItem}
                onDelete={deleteCatch}
                onEdit={editCatch}
                isDeleting={deletingId === catchItem.id}
              />
            )
          )}
        </div>
      </div>

      {importMessage && (
        <div className={`fixed top-8 right-8 px-6 py-3 rounded-2xl font-semibold ${
          importMessage.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {importMessage.text}
        </div>
      )}

      {showJsonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Indsæt JSON
            </h2>

            <textarea
              value={jsonPasteInput}
              onChange={(e) => setJsonPasteInput(e.target.value)}
              placeholder="Indsæt JSON her..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
              rows={10}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowJsonModal(false);
                  setJsonPasteInput("");
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Annuller
              </button>

              <button
                onClick={handleJsonPasteImport}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Importér
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">
              AI-fortolk fangst
            </h2>

            {!aiParsedResult ? (
              <>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Beskriv din fangst på dansk... fx: 'Fiskedag ved Kyndby i Roskilde Fjord. Brugte spinne som agn. En smuk sølvørred på omkring 65 cm, køn fisk. Vejret var vindfuldt fra nord.'"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                  rows={6}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAiModal(false);
                      setAiDescription("");
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
                  <h3 className="text-lg font-bold mb-3 text-cyan-400">
                    Parsed Result
                  </h3>

                  <div className="space-y-2 text-sm text-slate-300">
                    {aiParsedResult.date && (
                      <div>
                        <span className="font-semibold text-white">Dato:</span>{' '}
                        {aiParsedResult.date}
                      </div>
                    )}
                    {aiParsedResult.location && (
                      <div>
                        <span className="font-semibold text-white">Sted:</span>{' '}
                        {aiParsedResult.location}
                      </div>
                    )}
                    {aiParsedResult.fjord && (
                      <div>
                        <span className="font-semibold text-white">Fjord:</span>{' '}
                        {aiParsedResult.fjord}
                      </div>
                    )}
                    {aiParsedResult.bait && (
                      <div>
                        <span className="font-semibold text-white">Agn:</span>{' '}
                        {aiParsedResult.bait}
                      </div>
                    )}
                    {aiParsedResult.lengthCm && (
                      <div>
                        <span className="font-semibold text-white">
                          Længde:
                        </span>{' '}
                        {aiParsedResult.lengthCm} cm
                      </div>
                    )}
                    {aiParsedResult.undersized && (
                      <div>
                        <span className="font-semibold text-white">
                          Undersized:
                        </span>{' '}
                        Ja
                      </div>
                    )}
                    {aiParsedResult.windDirection && (
                      <div>
                        <span className="font-semibold text-white">Vind:</span>{' '}
                        {aiParsedResult.windDirection}
                      </div>
                    )}
                    {aiParsedResult.notes && (
                      <div>
                        <span className="font-semibold text-white">Noter:</span>{' '}
                        {aiParsedResult.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAiParsedResult(null);
                      setAiDescription("");
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
    </main>
  );
}