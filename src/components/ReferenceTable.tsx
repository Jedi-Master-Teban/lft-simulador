import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { REFERENCE, LFT_YEARS } from '../data/lft';
import type { LFTYear } from '../data/lft';

interface Props { currentYear: LFTYear; }

export function ReferenceTable({ currentYear }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4" style={{ color: '#1BBBEE' }} />
          <span className="text-sm font-bold text-[#2D2D2D]">
            Tabla de Referencia LFT — Jornada Legal por Año y Turno
          </span>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
          : <ChevronRight className="w-4 h-4 text-[#94A3B8]" />}
      </button>

      {open && (
        <div className="border-t border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#2870B5' }}>
                {['Año', 'Diurna', 'Mixta', 'Nocturna', 'Máx. Dobles', 'Máx. Triples', 'Total Máx. Diurna'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LFT_YEARS.map(year => {
                const ref = REFERENCE[year];
                const isCurrent = year === currentYear;
                return (
                  <tr
                    key={year}
                    className="border-t border-[#E2E8F0] transition-colors"
                    style={{ background: isCurrent ? '#E0F5FD' : undefined }}
                  >
                    <td className="px-4 py-2.5 text-center font-bold text-[#2D2D2D]">
                      {year}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full text-white" style={{ background: '#1BBBEE' }}>
                          activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-[#555555]">{ref.Diurna}h</td>
                    <td className="px-4 py-2.5 text-center text-[#555555]">{ref.Mixta}h</td>
                    <td className="px-4 py-2.5 text-center text-[#555555]">{ref.Nocturna}h</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[#F59E0B]">{ref.maxDouble}h</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[#EF4444]">{ref.maxTriple}h</td>
                    <td className="px-4 py-2.5 text-center text-[#94A3B8]">{ref.Diurna + ref.maxDouble + ref.maxTriple}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-[#94A3B8] border-t border-[#E2E8F0] italic leading-relaxed">
            <strong className="not-italic text-[#555555]">Horas dobles</strong> (Art. 67 LFT): primeras horas extra, pagadas al 2× del salario.{' '}
            <strong className="not-italic text-[#555555]">Horas triples</strong> (Art. 68 LFT): exceden el límite de dobles, pagadas al 3×.
          </p>
        </div>
      )}
    </div>
  );
}
