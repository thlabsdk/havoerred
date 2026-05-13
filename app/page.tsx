"use client";

import { useEffect, useState } from "react";

import CatchCard from "../components/CatchCard";
import CatchForm from "../components/CatchForm";
import StatsCards from "../components/StatsCards";

import { Catch } from "../types/catch";

import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [bait, setBait] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  const [catches, setCatches] = useState<
    Catch[]
  >([]);

  useEffect(() => {
    async function loadCatches() {
      const { data, error } = await supabase
        .from("catches")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setCatches(data as Catch[]);
      }

      setHydrated(true);
    }

    loadCatches();
  }, []);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setIsSaving(true);

    if (editingId !== null) {
      const { data, error } = await supabase
        .from("catches")
        .update({
          date,
          location,
          bait,
          notes,
        })
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        console.error(error);
        setIsSaving(false);
        return;
      }

      setCatches(
        catches.map((catchItem) =>
          catchItem.id === editingId
            ? (data as Catch)
            : catchItem
        )
      );

      setEditingId(null);
    } else {
      const { data, error } = await supabase
        .from("catches")
        .insert([
          {
            date,
            location,
            bait,
            notes,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        setIsSaving(false);
        return;
      }

      setCatches([
        data as Catch,
        ...catches,
      ]);
    }

    setIsSaving(false);

    setDate("");
    setLocation("");
    setBait("");
    setNotes("");
  }

  function editCatch(catchItem: Catch) {
    setEditingId(catchItem.id);

    setDate(catchItem.date);
    setLocation(catchItem.location);
    setBait(catchItem.bait);
    setNotes(catchItem.notes);
  }

  async function deleteCatch(id: number) {
    const { error } = await supabase
      .from("catches")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setCatches(
      catches.filter(
        (catchItem) => catchItem.id !== id
      )
    );
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
    return null;
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
            bait={bait}
            setBait={setBait}
            notes={notes}
            setNotes={setNotes}
            onSubmit={handleSubmit}
            isEditing={
              editingId !== null
            }
            isSaving={isSaving}
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
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}