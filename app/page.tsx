"use client";

import { useEffect, useState } from "react";

import CatchCard from "../components/CatchCard";
import CatchForm from "../components/CatchForm";
import StatsCards from "../components/StatsCards";

import {
  Catch,
  CatchFromDB,
} from "../types/catch";

import {
  mapCatchFromDb,
  toCatchInsertPayload,
  toCatchUpdatePayload,
} from "../lib/catch_mappers";

import { catchSchema } from "../lib/catch-schema";

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
    async function loadCatches() {
      try {
        const { data, error } = await supabase
          .from("catches")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error(
            "Failed to load catches:",
            formatSupabaseError(error)
          );
          return;
        }

        if (data) {
          setCatches(
            (data as CatchFromDB[]).map(mapCatchFromDb)
          );
        }
      } finally {
        setHydrated(true);
      }
    }

    loadCatches();
  }, []);

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
    </main>
  );
}