"use client";

import { useEffect, useState } from "react";

import Tabs, { type TabKey } from "../components/Tabs";
import CatchesView from "../components/CatchesView";
import BulkOpsView from "../components/BulkOpsView";
import SpotsView from "../components/SpotsView";

import type { Catch, CatchFromDB, CatchInsert, CatchUpdate } from "../types/catch";
import type { Spot, SpotFromDB, SpotInsert, SpotUpdate } from "../types/spot";

import {
  mapCatchFromDb,
  toCatchInsertPayload,
  toCatchUpdatePayload,
} from "../lib/catch_mappers";
import {
  mapSpotFromDb,
  toSpotInsertPayload,
  toSpotUpdatePayload,
} from "../lib/spot_mappers";

import { supabase } from "../lib/supabase";

type Toast = { text: string; type: 'success' | 'error' };

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return error;
  if ("message" in error) {
    return (error as { message?: string }).message ?? error;
  }
  return error;
}

export default function HomePage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<TabKey>('catches');
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [catchesResult, spotsResult] = await Promise.allSettled([
          supabase.from("catches").select("*").order("created_at", { ascending: false }),
          supabase.from("spots").select("*").order("name", { ascending: true }),
        ]);

        if (catchesResult.status === 'fulfilled') {
          const { data, error } = catchesResult.value;
          if (error) console.error("Failed to load catches:", formatSupabaseError(error));
          else if (data) setCatches((data as CatchFromDB[]).map(mapCatchFromDb));
        } else {
          console.error("Failed to load catches:", catchesResult.reason);
        }

        if (spotsResult.status === 'fulfilled') {
          const { data, error } = spotsResult.value;
          if (error) console.error("Failed to load spots:", formatSupabaseError(error));
          else if (data) setSpots((data as SpotFromDB[]).map(mapSpotFromDb));
        } else {
          console.error("Failed to load spots:", spotsResult.reason);
        }
      } finally {
        setHydrated(true);
      }
    }

    loadInitialData();
  }, []);

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ---- Catch operations ----

  async function insertCatch(payload: CatchInsert): Promise<Catch | null> {
    const { data, error } = await supabase
      .from("catches")
      .insert([toCatchInsertPayload(payload)])
      .select()
      .single();
    if (error) {
      console.error("Failed to insert catch:", formatSupabaseError(error));
      showToast('Kunne ikke gemme fangst', 'error');
      return null;
    }
    const mapped = mapCatchFromDb(data as CatchFromDB);
    setCatches((prev) => [mapped, ...prev]);
    return mapped;
  }

  async function updateCatch(id: number, payload: CatchUpdate): Promise<Catch | null> {
    const { data, error } = await supabase
      .from("catches")
      .update(toCatchUpdatePayload(payload))
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Failed to update catch:", formatSupabaseError(error));
      showToast('Kunne ikke opdatere fangst', 'error');
      return null;
    }
    const mapped = mapCatchFromDb(data as CatchFromDB);
    setCatches((prev) => prev.map((c) => (c.id === id ? mapped : c)));
    return mapped;
  }

  async function deleteCatch(id: number): Promise<boolean> {
    const { error } = await supabase.from("catches").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete catch:", formatSupabaseError(error));
      showToast('Kunne ikke slette fangst', 'error');
      return false;
    }
    setCatches((prev) => prev.filter((c) => c.id !== id));
    return true;
  }

  async function bulkInsertCatches(payloads: CatchInsert[]): Promise<number> {
    const { data, error } = await supabase
      .from("catches")
      .insert(payloads.map(toCatchInsertPayload))
      .select();
    if (error) {
      console.error("Failed to import catches:", formatSupabaseError(error));
      showToast('Bulk-import af fangster fejlede', 'error');
      return 0;
    }
    const mapped = (data as CatchFromDB[]).map(mapCatchFromDb);
    setCatches((prev) => [...mapped, ...prev]);
    return mapped.length;
  }

  // ---- Spot operations ----

  async function createSpot(payload: SpotInsert): Promise<Spot | null> {
    const { data, error } = await supabase
      .from("spots")
      .insert([toSpotInsertPayload(payload)])
      .select()
      .single();
    if (error) {
      console.error("Failed to create spot:", formatSupabaseError(error));
      showToast('Kunne ikke oprette sted', 'error');
      return null;
    }
    const mapped = mapSpotFromDb(data as SpotFromDB);
    setSpots((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  }

  async function updateSpot(id: number, payload: SpotUpdate): Promise<Spot | null> {
    const { data, error } = await supabase
      .from("spots")
      .update(toSpotUpdatePayload(payload))
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Failed to update spot:", formatSupabaseError(error));
      showToast('Kunne ikke opdatere sted', 'error');
      return null;
    }
    const mapped = mapSpotFromDb(data as SpotFromDB);
    setSpots((prev) =>
      prev.map((s) => (s.id === id ? mapped : s)).sort((a, b) => a.name.localeCompare(b.name))
    );
    return mapped;
  }

  async function deleteSpot(id: number): Promise<boolean> {
    const { error } = await supabase.from("spots").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete spot:", formatSupabaseError(error));
      showToast('Kunne ikke slette sted', 'error');
      return false;
    }
    setSpots((prev) => prev.filter((s) => s.id !== id));
    setCatches((prev) => prev.map((c) => (c.spotId === id ? { ...c, spotId: null } : c)));
    return true;
  }

  async function bulkInsertSpots(payloads: SpotInsert[]): Promise<number> {
    const { data, error } = await supabase
      .from("spots")
      .insert(payloads.map(toSpotInsertPayload))
      .select();
    if (error) {
      console.error("Failed to import spots:", formatSupabaseError(error));
      showToast('Bulk-import af steder fejlede', 'error');
      return 0;
    }
    const mapped = (data as SpotFromDB[]).map(mapSpotFromDb);
    setSpots((prev) => [...prev, ...mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped.length;
  }

  // Callback used by the SpotPicker inside CatchForm.
  async function createSpotFromText(name: string, bodyOfWater: string): Promise<Spot | null> {
    return createSpot({
      name,
      aliases: [],
      bodyOfWater,
      latitude: null,
      longitude: null,
      region: '',
      notes: '',
    });
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-12 bg-slate-900 rounded-2xl mb-6 animate-pulse" />
          <div className="h-20 bg-slate-900 rounded-2xl mb-6 animate-pulse" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 mb-8">
            <div className="h-10 bg-slate-800 rounded mb-4 animate-pulse" />
            <div className="h-32 bg-slate-800 rounded mb-6 animate-pulse" />
            <div className="h-12 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Tabs active={tab} onChange={setTab} />

        {tab === 'catches' && (
          <CatchesView
            catches={catches}
            spots={spots}
            onInsertCatch={insertCatch}
            onUpdateCatch={updateCatch}
            onDeleteCatch={deleteCatch}
            onCreateSpot={createSpotFromText}
            onToast={showToast}
          />
        )}

        {tab === 'bulk' && (
          <BulkOpsView
            catches={catches}
            onImportCatches={bulkInsertCatches}
            onToast={showToast}
          />
        )}

        {tab === 'spots' && (
          <SpotsView
            spots={spots}
            onCreateSpot={createSpot}
            onUpdateSpot={updateSpot}
            onDeleteSpot={deleteSpot}
            onImportSpots={bulkInsertSpots}
            onToast={showToast}
          />
        )}
      </div>

      {toast && (
        <div
          className={`fixed top-8 right-8 px-6 py-3 rounded-2xl font-semibold shadow-2xl ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </main>
  );
}
