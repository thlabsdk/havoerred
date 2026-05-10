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
}: CatchFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Dato
        </label>

       <input
  type="text"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  placeholder="dd/mm/yyyy"
  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
/>
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Sted
        </label>

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Fx Kyndby"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Agn
        </label>

        <input
          type="text"
          value={bait}
          onChange={(e) => setBait(e.target.value)}
          placeholder="Fx Bombarda med Kobberbassen"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Kommentar
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Beskriv forholdene..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 h-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-colors"
      >
        {isEditing ? "Opdater fangst" : "Gem fangst"}
      </button>
    </form>
  );
}