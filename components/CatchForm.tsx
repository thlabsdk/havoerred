'use client';

import { useState } from 'react';

type ValidationErrors = {
  date?: string;
  location?: string;
  bait?: string;
  notes?: string;
};

type CatchFormProps = {
  date: string;
  setDate: (value: string) => void;

  location: string;
  setLocation: (value: string) => void;

  bait: string;
  setBait: (value: string) => void;

  notes: string;
  setNotes: (value: string) => void;

  onSubmit: (e: React.FormEvent) => void;

  isEditing: boolean;

  isSaving: boolean;
};

const validateDate = (dateStr: string): string | undefined => {
  if (!dateStr.trim()) {
    return 'Dato er påkrævet';
  }
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(dateRegex);
  if (!match) {
    return 'Dato skal være i format dd/mm/yyyy';
  }
  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12) {
    return 'Måned skal være mellem 01 og 12';
  }
  if (dayNum < 1 || dayNum > 31) {
    return 'Dag skal være mellem 01 og 31';
  }
  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return 'Ugyldig dato';
  }
  return undefined;
};

const validateForm = (
  date: string,
  location: string,
  bait: string,
  notes: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const dateError = validateDate(date);
  if (dateError) {
    errors.date = dateError;
  }

  if (!location.trim()) {
    errors.location = 'Sted er påkrævet';
  }

  if (!bait.trim()) {
    errors.bait = 'Agn er påkrævet';
  }

  if (notes.length > 500) {
    errors.notes = 'Kommentar kan ikke være længere end 500 tegn';
  }

  return errors;
};

export default function CatchForm({
  date,
  setDate,
  location,
  setLocation,
  bait,
  setBait,
  notes,
  setNotes,
  onSubmit,
  isEditing,
  isSaving,
}: CatchFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const hasErrors = (validationErrors: ValidationErrors): boolean => {
    return Object.keys(validationErrors).length > 0;
  };

  const validateAndSetErrors = (): ValidationErrors => {
    const newErrors = validateForm(date, location, bait, notes);
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAndSetErrors();

    if (!hasErrors(newErrors)) {
      onSubmit(e);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Dato
        </label>

        <input
          type="text"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            if (errors.date) {
              setErrors((prev) => ({ ...prev, date: undefined }));
            }
          }}
          placeholder="dd/mm/yyyy"
          className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
            errors.date
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-400">{errors.date}</p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Sted
        </label>

        <input
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            if (errors.location) {
              setErrors((prev) => ({ ...prev, location: undefined }));
            }
          }}
          placeholder="Fx Kyndby"
          className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
            errors.location
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          }`}
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-400">{errors.location}</p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Agn
        </label>

        <input
          type="text"
          value={bait}
          onChange={(e) => {
            setBait(e.target.value);
            if (errors.bait) {
              setErrors((prev) => ({ ...prev, bait: undefined }));
            }
          }}
          placeholder="Fx Bombarda med Kobberbassen"
          className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
            errors.bait
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          }`}
        />
        {errors.bait && (
          <p className="mt-1 text-sm text-red-400">{errors.bait}</p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Kommentar
        </label>

        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (errors.notes) {
              setErrors((prev) => ({ ...prev, notes: undefined }));
            }
          }}
          placeholder="Beskriv forholdene..."
          className={`w-full bg-slate-800 border rounded-xl p-3 h-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
            errors.notes
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          <p
            className={`text-xs ${
              notes.length > 450 ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {notes.length}/500
          </p>
          {errors.notes && (
            <p className="text-sm text-red-400">{errors.notes}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving || Object.keys(errors).length > 0}
        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold py-3 rounded-xl transition-colors"
      >
        {isSaving
          ? "Gemmer..."
          : isEditing
          ? "Opdater fangst"
          : "Gem fangst"}
      </button>
    </form>
  );
}