import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculateCrewResult, createDefaultCrew, createDefaultState } from './data/lft';
import type { AppState, Crew } from './data/lft';
import { FirmHeader } from './components/FirmHeader';
import { ReferenceTable } from './components/ReferenceTable';
import { CrewCard } from './components/CrewCard';
import { SummaryPanel } from './components/SummaryPanel';
import { ExportButtons } from './components/ExportButtons';
import { StickyBar } from './components/StickyBar';

const STORAGE_KEY = 'lft-simulador-v1';

export default function App() {
  const [state, setState] = useLocalStorage<AppState>(STORAGE_KEY, createDefaultState);
  const { firm, crews } = state;
  const headerRef = useRef<HTMLElement>(null);

  const updateFirm = (next: AppState['firm']) =>
    setState(s => ({ ...s, firm: next }));

  const addCrew = () =>
    setState(s => ({ ...s, crews: [...s.crews, createDefaultCrew(s.crews.length)] }));

  const updateCrew = (id: string, next: Crew) =>
    setState(s => ({ ...s, crews: s.crews.map(c => c.id === id ? next : c) }));

  const deleteCrew = (id: string) =>
    setState(s => ({ ...s, crews: s.crews.filter(c => c.id !== id) }));

  const results = crews.map(c => calculateCrewResult(c, firm));

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Sticky compliance bar — appears after scrolling past header */}
      <StickyBar results={results} firm={firm} headerRef={headerRef} />

      {/* Main header */}
      <header ref={headerRef as React.RefObject<HTMLElement>}>
        <FirmHeader firm={firm} onUpdate={updateFirm} />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Reference table */}
        <ReferenceTable currentYear={firm.year} />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: '#1BBBEE' }}>
            Tripulaciones ({crews.length})
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportButtons state={state} results={results} />
            <div className="w-px h-5 bg-[#E2E8F0]" />
            <button
              onClick={addCrew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-sm"
              style={{ background: '#1BBBEE' }}
              onMouseOver={e => (e.currentTarget.style.background = '#2870B5')}
              onMouseOut={e => (e.currentTarget.style.background = '#1BBBEE')}
            >
              <Plus className="w-4 h-4" />
              Agregar tripulación
            </button>
          </div>
        </div>

        {/* Crew cards */}
        {crews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-sm mb-4">No hay tripulaciones registradas.</p>
            <button
              onClick={addCrew}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: '#1BBBEE' }}
            >
              <Plus className="w-4 h-4" />
              Agregar primera tripulación
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {crews.map((crew, i) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                result={results[i]}
                firm={firm}
                onUpdate={next => updateCrew(crew.id, next)}
                onDelete={() => deleteCrew(crew.id)}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {crews.length > 0 && <SummaryPanel crews={crews} results={results} firm={firm} />}

        {/* Footer / Disclaimer */}
        <footer className="rounded-2xl px-5 py-4 text-center space-y-1" style={{ background: '#2D2D2D' }}>
          <p className="text-xs font-bold" style={{ color: '#1BBBEE' }}>
            ® Prohibido el uso o distribución sin autorización expresa de Catch Consulting, S.C.
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            www.catchconsulting.com.mx &nbsp;·&nbsp; Simulador de Jornada Laboral &nbsp;·&nbsp;
            Rev.{' '}
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Herramienta informativa — Arts. 58–68 LFT · Reforma constitucional 2026–2030. No constituye asesoría jurídica.
          </p>
        </footer>
      </main>
    </div>
  );
}
