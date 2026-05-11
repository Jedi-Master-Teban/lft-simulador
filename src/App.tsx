import { Plus } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculateCrewResult, createDefaultCrew, createDefaultState } from './data/lft';
import type { AppState, Crew } from './data/lft';
import { FirmHeader } from './components/FirmHeader';
import { ReferenceTable } from './components/ReferenceTable';
import { CrewCard } from './components/CrewCard';
import { SummaryPanel } from './components/SummaryPanel';

const STORAGE_KEY = 'lft-simulador-v1';

export default function App() {
  const [state, setState] = useLocalStorage<AppState>(STORAGE_KEY, createDefaultState);

  const { firm, crews } = state;

  // ── State helpers ──────────────────────────────────────────────────────

  const updateFirm = (next: AppState['firm']) =>
    setState(s => ({ ...s, firm: next }));

  const addCrew = () =>
    setState(s => ({
      ...s,
      crews: [...s.crews, createDefaultCrew(s.crews.length)],
    }));

  const updateCrew = (id: string, next: Crew) =>
    setState(s => ({
      ...s,
      crews: s.crews.map(c => (c.id === id ? next : c)),
    }));

  const deleteCrew = (id: string) =>
    setState(s => ({ ...s, crews: s.crews.filter(c => c.id !== id) }));

  // ── Calculations (derived) ─────────────────────────────────────────────

  const results = crews.map(c => calculateCrewResult(c, firm));

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Fixed top header */}
      <FirmHeader firm={firm} onUpdate={updateFirm} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Reference table */}
        <ReferenceTable currentYear={firm.year} />

        {/* Crews section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Tripulaciones ({crews.length})
            </h2>
            <button
              onClick={addCrew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar tripulación
            </button>
          </div>

          {crews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400 text-sm mb-3">
                No hay tripulaciones registradas.
              </p>
              <button
                onClick={addCrew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar primera tripulación
              </button>
            </div>
          ) : (
            crews.map((crew, i) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                result={results[i]}
                firm={firm}
                onUpdate={next => updateCrew(crew.id, next)}
                onDelete={() => deleteCrew(crew.id)}
              />
            ))
          )}
        </section>

        {/* Summary panel */}
        {crews.length > 0 && (
          <SummaryPanel crews={crews} results={results} firm={firm} />
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          Simulador LFT 2026–2030 · Arts. 58–68 Ley Federal del Trabajo ·
          Reforma constitucional en vigor
        </footer>
      </main>
    </div>
  );
}
