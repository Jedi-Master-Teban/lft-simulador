import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { REFERENCE, LFT_YEARS } from '../data/lft';
import type { LFTYear } from '../data/lft';

interface Props {
  currentYear: LFTYear;
}

export function ReferenceTable({ currentYear }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">
            Tabla de Referencia LFT — Jornada Legal por Año y Turno
          </span>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-400" />
          : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Año</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Diurna</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Mixta</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Nocturna</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-amber-600 uppercase tracking-wider">Máx. Dobles</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">Máx. Triples</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Máx. Diurna</th>
              </tr>
            </thead>
            <tbody>
              {LFT_YEARS.map(year => {
                const ref = REFERENCE[year];
                const isCurrent = year === currentYear;
                return (
                  <tr
                    key={year}
                    className={`border-t border-slate-100 ${isCurrent ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {year}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                          activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-700">{ref.Diurna}h</td>
                    <td className="px-4 py-2.5 text-center text-slate-700">{ref.Mixta}h</td>
                    <td className="px-4 py-2.5 text-center text-slate-700">{ref.Nocturna}h</td>
                    <td className="px-4 py-2.5 text-center font-medium text-amber-700">{ref.maxDouble}h</td>
                    <td className="px-4 py-2.5 text-center font-medium text-red-700">{ref.maxTriple}h</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">
                      {ref.Diurna + ref.maxDouble + ref.maxTriple}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
            <strong>Horas dobles</strong> (Art. 67 LFT): primeras horas extra, pagadas al 2× del salario.
            {' '}<strong>Horas triples</strong> (Art. 68 LFT): horas extra que exceden el límite de dobles, pagadas al 3×.
            {' '}Los límites de jornada se reducen progresivamente hasta 2030 por la reforma constitucional.
          </p>
        </div>
      )}
    </div>
  );
}
