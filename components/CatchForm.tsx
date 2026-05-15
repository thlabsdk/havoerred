'use client';

import { useState } from 'react';
import type { Spot } from '../types/spot';
import SpotPicker from './SpotPicker';

type ValidationErrors = {
  date?: string;
  timeOfDay?: string;
  location?: string;
  bait?: string;
  notes?: string;
};

type CatchFormProps = {
  date: string;
  setDate: (value: string) => void;

  timeOfDay: string;
  setTimeOfDay: (value: string) => void;

  location: string;
  setLocation: (value: string) => void;

  fjord: string;
  setFjord: (value: string) => void;

  bait: string;
  setBait: (value: string) => void;

  lengthCm: number | null;
  setLengthCm: (value: number | null) => void;

  undersized: boolean;
  setUndersized: (value: boolean) => void;

  windDirection: string;
  setWindDirection: (value: string) => void;

  notes: string;
  setNotes: (value: string) => void;

  spotId: number | null;
  setSpotId: (value: number | null) => void;

  spots: Spot[];

  onCreateSpot: (name: string, bodyOfWater: string) => Promise<Spot | null>;

  onSubmit: (e: React.FormEvent) => void;

  isEditing: boolean;

  isSaving: boolean;

  isDisabled?: boolean;
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

const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateTimeOfDay = (value: string): string | undefined => {
  if (!value.trim()) return 'Tidspunkt er påkrævet';
  if (!TIME_OF_DAY_REGEX.test(value)) return 'Tidspunkt skal være i format HH:mm (24-timer)';
  return undefined;
};

const validateForm = (
  date: string,
  timeOfDay: string,
  location: string,
  bait: string,
  notes: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const dateError = validateDate(date);
  if (dateError) {
    errors.date = dateError;
  }

  const timeError = validateTimeOfDay(timeOfDay);
  if (timeError) {
    errors.timeOfDay = timeError;
  }

  if (!location.trim()) {
    errors.location = 'Sted er påkrævet';
  } else if (location.trim().length < 2) {
    errors.location = 'Sted skal være mindst 2 tegn';
  } else if (location.length > 100) {
    errors.location = 'Sted kan ikke være længere end 100 tegn';
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
  timeOfDay,
  setTimeOfDay,
  location,
  setLocation,
  fjord,
  setFjord,
  bait,
  setBait,
  lengthCm,
  setLengthCm,
  undersized,
  setUndersized,
  windDirection,
  setWindDirection,
  notes,
  setNotes,
  spotId,
  setSpotId,
  spots,
  onCreateSpot,
  onSubmit,
  isEditing,
  isSaving,
  isDisabled = false,
}: CatchFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const clearFieldError = (fieldName: keyof ValidationErrors) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const hasErrors = (validationErrors: ValidationErrors): boolean => {
    return Object.keys(validationErrors).length > 0;
  };

  const validateAndSetErrors = (): ValidationErrors => {
    const newErrors = validateForm(date, timeOfDay, location, bait, notes);
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
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">
            Dato
          </label>

          <input
            type="text"
            value={date}
            disabled={isDisabled}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) {
                clearFieldError('date');
              }
            }}
            placeholder="dd/mm/yyyy"
            className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
            Tidspunkt
          </label>

          <input
            type="time"
            value={timeOfDay}
            disabled={isDisabled}
            onChange={(e) => {
              setTimeOfDay(e.target.value);
              if (errors.timeOfDay) {
                clearFieldError('timeOfDay');
              }
            }}
            placeholder="HH:mm"
            className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              errors.timeOfDay
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-700 focus:ring-cyan-500'
            }`}
          />
          {errors.timeOfDay && (
            <p className="mt-1 text-sm text-red-400">{errors.timeOfDay}</p>
          )}
        </div>
      </div>

      <SpotPicker
        spots={spots}
        selectedSpotId={spotId}
        onChange={(id, name) => {
          setSpotId(id);
          if (name) {
            setLocation(name);
            if (errors.location) clearFieldError('location');
          }
        }}
        currentLocationText={location}
        currentFjordText={fjord}
        onCreateSpot={onCreateSpot}
        isDisabled={isDisabled}
      />

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Sted (fritekst)
        </label>

        <input
          type="text"
          value={location}
          disabled={isDisabled}
          onChange={(e) => {
            setLocation(e.target.value);
            if (spotId !== null) setSpotId(null);
            if (errors.location) {
              clearFieldError('location');
            }
          }}
          placeholder="Fx Kyndby"
          className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
          Fjord
        </label>

        <input
          type="text"
          value={fjord}
          disabled={isDisabled}
          onChange={(e) => setFjord(e.target.value)}
          placeholder="Fx Roskilde Fjord"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">
            Længde (cm)
          </label>

          <input
            type="number"
            min={0}
            step={1}
            value={lengthCm ?? ''}
            disabled={isDisabled}
            onChange={(e) => {
              const value = e.target.value;
              setLengthCm(value === '' ? null : Number(value));
            }}
            placeholder="Fx 67"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-end">
          <label className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 cursor-pointer transition-colors hover:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed">
            <span className="block mb-2 text-sm font-semibold text-slate-300">
              Undersized
            </span>
            <input
              type="checkbox"
              checked={undersized}
              disabled={isDisabled}
              onChange={(e) => setUndersized(e.target.checked)}
              className="h-5 w-5 rounded text-cyan-500 focus:ring-cyan-500"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Vindretning
        </label>

        <input
          type="text"
          value={windDirection}
          disabled={isDisabled}
          onChange={(e) => setWindDirection(e.target.value)}
          placeholder="Fx NNV"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Agn
        </label>

        <input
          type="text"
          value={bait}
          disabled={isDisabled}
          onChange={(e) => {
            setBait(e.target.value);
            if (errors.bait) {
              clearFieldError('bait');
            }
          }}
          placeholder="Fx Bombarda med Kobberbassen"
          className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
          disabled={isDisabled}
          onChange={(e) => {
            setNotes(e.target.value);
            if (errors.notes) {
              clearFieldError('notes');
            }
          }}
          placeholder="Beskriv forholdene..."
          className={`w-full bg-slate-800 border rounded-xl p-3 h-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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