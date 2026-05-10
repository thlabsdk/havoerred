"use client";

import { useEffect, useState } from "react";

import CatchCard from "../components/CatchCard";
import CatchForm from "../components/CatchForm";
import StatsCards from "../components/StatsCards";

import { Catch } from "../types/catch";

export default function HomePage() {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [bait, setBait] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [hydrated, setHydrated] =
    useState(false);

  const [catches, setCatches] = useState<
    Catch[]
  >([]);

  useEffect(() => {
    try {
      const savedCatches =
        localStorage.getItem("catches");

      if (savedCatches) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCatches(
          JSON.parse(savedCatches) as Catch[]
        );
      }
    } catch (error) {
      console.error(
        "Failed to load catches",
        error
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      "catches",
      JSON.stringify(catches)
    );
  }, [catches, hydrated]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId !== null) {
      setCatches(
        catches.map((catchItem) =>
          catchItem.id === editingId
            ? {
                ...catchItem,
                date,
                location,
                bait,
                notes,
              }
            : catchItem
        )
      );

      setEditingId(null);
    } else {
      const newCatch: Catch = {
        id: Date.now(),
        date,
        location,
        bait,
        notes,
      };

      setCatches([newCatch, ...catches]);
    }

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

  function deleteCatch(id: number) {
    setCatches(
      catches.filter(
        (catchItem) => catchItem.id !== id
      )
    );
  }

  const filteredCatches = catches.filter(
    (catchItem) => {
      const searchLower = search.toLowerCase();

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
            Registrér dine fangster i fjorden
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
            isEditing={editingId !== null}
          />
        </div>

        <div className="space-y-4">
          {filteredCatches.map((catchItem) => (
            <CatchCard
              key={catchItem.id}
              catchItem={catchItem}
              onDelete={deleteCatch}
              onEdit={editCatch}
            />
          ))}
        </div>
      </div>
    </main>
  );
}