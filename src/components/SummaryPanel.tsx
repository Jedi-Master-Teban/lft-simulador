import { CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import type { Crew, CrewResult, FirmConfig } from '../data/lft';
import { formatMXN, formatHours } from '../data/lft';

interface Props { crews: Crew[]; results: CrewResult[]; firm: FirmConfig; }

export function SummaryPanel({ crews, results, firm }: Props) {
  if (crews.length === 0) return null;

  const violating = results.filter(r => !r.isCompliant).length;
  const compliant = results.length - violating;
  const totalCost = results.reduce((s, r) => s + r.totalOTCost, 0);
  const totalWorkers = crews.reduce((s, c) => s + c.workers, 0);
  const allOk = violating === 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `2px solid ${allOk ? '#1BBBEE' : '#EF4444'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header — uses brand blues, not black */}
      <div
        className="px-5 py-4 flex items-center gap-3 flex-wrap"
        style={{ background: allOk ? '#1BBBEE' : '#2870B5' }}
      >
        {allOk
          ? <CheckCircle className="w-5 h-5 text-white shrink-0" />
          : <XCircle className="w-5 h-5 text-white shrink-0" />}
        <h2 className="text-base font-extrabold text-white">
          {allOk
            ? `Empresa en cumplimiento con la LFT ${firm.year}`
            : `${violating} tripulación${violating !== 1 ? 'es' : ''} con incumplimiento — LFT ${firm.year}`}
        </h2>
        {(firm.razonSocial || firm.planta) && (
          <span className="ml-auto text-sm text-white/70 hidden sm:block">
            {firm.razonSocial}{firm.planta ? ` · ${firm.planta}` : ''}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#E2E8F0] bg-white">
        <Tile icon={<Users className="w-4 h-4" />} label="Trabajadores totales" value={String(totalWorkers)} sub={`${crews.length} tripulación${crews.length !== 1 ? 'es' : ''}`} iconColor="#1BBBEE" valueColor="#2D2D2D" />
        <Tile icon={<CheckCircle className="w-4 h-4" />} label="En cumplimiento" value={`${compliant} / ${results.length}`} sub="tripulaciones" iconColor={allOk ? '#10B981' : '#94A3B8'} valueColor={allOk ? '#065F46' : '#555555'} />
        <Tile icon={<XCircle className="w-4 h-4" />} label="Con incumplimiento" value={String(violating)} sub="tripulaciones" iconColor={violating > 0 ? '#EF4444' : '#94A3B8'} valueColor={violating > 0 ? '#991B1B' : '#555555'} />
        <Tile icon={<TrendingUp className="w-4 h-4" />} label="Costo Semanal" value={formatMXN(totalCost)} sub={totalCost > 0 ? 'por horas extraordinarias' : 'sin horas extra'} iconColor={totalCost > 0 ? '#F59E0B' : '#10B981'} valueColor={totalCost > 0 ? '#92400E' : '#065F46'} />
      </div>

      {/* Per-crew breakdown */}
      <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: '#1BBBEE' }}>
          Resumen por Tripulación
        </p>
        <div className="space-y-2">
          {results.map((r, i) => {
            const crew = crews[i];
            return (
              <div
                key={r.crewId}
                className="flex items-center gap-3 text-sm bg-white rounded-xl px-4 py-2.5 border transition-colors"
                style={{ borderColor: r.isCompliant ? '#E2E8F0' : '#FECACA' }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.isCompliant ? '#10B981' : '#EF4444' }} />
                <span className="font-bold text-[#2D2D2D] min-w-[130px]">{crew.nombre}</span>
                <span className="text-[#94A3B8] hidden sm:inline text-xs">{r.effectiveShiftType} · {crew.workers} trab.</span>
                <span className="text-[#555555] text-xs">{formatHours(r.totalWeeklyHours)} / sem</span>
                {r.overtimeHours > 0 && <span className="text-xs font-semibold text-[#F59E0B]">+{formatHours(r.overtimeHours)} TE</span>}
                <span className="ml-auto font-bold text-[#2D2D2D] text-sm">{formatMXN(r.totalOTCost)}</span>
                {!r.isCompliant && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full border" style={{ background: '#FEE2E2', color: '#EF4444', borderColor: '#FECACA' }}>
                    {r.violations.length} violación{r.violations.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, sub, iconColor, valueColor }: {
  icon: React.ReactNode; label: string; value: string; sub: string; iconColor: string; valueColor: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-4">
      <div className="flex items-center gap-1.5 mb-0.5" style={{ color: iconColor }}>
        {icon}
        <span className="text-[10px] font-extrabold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl font-extrabold" style={{ color: valueColor }}>{value}</span>
      <span className="text-xs text-[#94A3B8]">{sub}</span>
    </div>
  );
}
