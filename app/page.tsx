"use client";

import { useEffect, useState } from "react";

import CatchCard from "../components/CatchCard";
import CatchForm from "../components/CatchForm";
import StatsCards from "../components/StatsCards";

type Catch = {
  id: number;
  date: string;
  location: string;
  bait: string;
  notes: string;
};

export default function HomePage() {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [bait, setBait] = useState("");
  const [notes, setNotes] = useState("");

  const [catches, setCatches] = useState<Catch[]>([]);

  useEffect(() => {
    const savedCatches = localStorage.getItem("catches");

    if (savedCatches) {
      setCatches(JSON.parse(savedCatches));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "catches",
      JSON.stringify(catches)
    );
  }, [catches]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newCatch: Catch = {
      id: Date.now(),
      date,
      location,
      bait,
      notes,
    };

    setCatches([newCatch, ...catches]);

    setDate("");
    setLocation("");
    setBait("");
    setNotes("");
  }

  function deleteCatch(id: number) {
    setCatches(
      catches.filter((catchItem) => catchItem.id !== id)
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <StatsCards catches={catches} />
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
          />
        </div>

        <div className="space-y-4">
          {catches.map((catchItem) => (
            <CatchCard
              key={catchItem.id}
              catchItem={catchItem}
              onDelete={deleteCatch}
            />
          ))}
        </div>
      </div>
    </main>
  );
}