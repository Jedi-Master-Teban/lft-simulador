import { CheckCircle, XCircle, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import type { Crew, CrewResult, FirmConfig } from '../data/lft';
import { formatMXN, formatHours, isDayActive } from '../data/lft';

interface Props { crews: Crew[]; results: CrewResult[]; firm: FirmConfig; }

export function SummaryPanel({ crews, results, firm }: Props) {
  if (crews.length === 0) return null;

  const hasSalary = firm.salarioDiario > 0;

  const violating = results.filter(r => !r.isCompliant).length;
  const compliant = results.length - violating;
  const totalOTCost = results.reduce((s, r) => s + r.totalOTCost, 0);
  const totalWorkers = crews.reduce((s, c) => s + c.workers, 0);
  const allOk = violating === 0;

  // Weekly base salary cost per crew: salarioDiario × workers × days actually worked
  const crewBaseCosts = crews.map(c => {
    if (!hasSalary) return 0;
    const activeDays = c.schedule.filter(d => isDayActive(d)).length;
    return firm.salarioDiario * c.workers * activeDays;
  });
  const totalBaseCost = crewBaseCosts.reduce((s, v) => s + v, 0);
  const totalWeeklyPayroll = totalBaseCost + totalOTCost;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `2px solid ${allOk ? '#1BBBEE' : '#EF4444'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
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
            : `${violating} ${violating !== 1 ? 'tripulaciones' : 'tripulación'} con incumplimiento — LFT ${firm.year}`}
        </h2>
        {(firm.razonSocial || firm.planta) && (
          <span className="ml-auto text-sm text-white/70 hidden sm:block">
            {firm.razonSocial}{firm.planta ? ` · ${firm.planta}` : ''}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#E2E8F0] bg-white">
        <Tile
          icon={<Users className="w-4 h-4" />}
          label="Trabajadores totales"
          value={String(totalWorkers)}
          sub={`${crews.length} ${crews.length !== 1 ? 'tripulaciones' : 'tripulación'}`}
          iconColor="#1BBBEE"
          valueColor="#2D2D2D"
        />
        <Tile
          icon={<CheckCircle className="w-4 h-4" />}
          label="En cumplimiento"
          value={`${compliant} / ${results.length}`}
          sub={compliant !== 1 ? 'tripulaciones' : 'tripulación'}
          iconColor={allOk ? '#10B981' : '#94A3B8'}
          valueColor={allOk ? '#065F46' : '#555555'}
        />
        <Tile
          icon={<XCircle className="w-4 h-4" />}
          label="Con incumplimiento"
          value={String(violating)}
          sub={violating !== 1 ? 'tripulaciones' : 'tripulación'}
          iconColor={violating > 0 ? '#EF4444' : '#94A3B8'}
          valueColor={violating > 0 ? '#991B1B' : '#555555'}
        />
        <Tile
          icon={<TrendingUp className="w-4 h-4" />}
          label="Nómina Semanal"
          value={hasSalary ? formatMXN(totalWeeklyPayroll) : '—'}
          sub={
            !hasSalary
              ? 'configura el salario diario'
              : totalOTCost > 0
                ? `+ ${formatMXN(totalOTCost)} en horas extra`
                : 'sin horas extra'
          }
          iconColor={totalOTCost > 0 ? '#F59E0B' : '#10B981'}
          valueColor={totalOTCost > 0 ? '#92400E' : '#065F46'}
        />
      </div>

      {/* Per-crew breakdown */}
      <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: '#1BBBEE' }}>
          Resumen por Tripulación
        </p>
        <div className="space-y-2">
          {results.map((r, i) => {
            const crew = crews[i];
            const baseCost = crewBaseCosts[i];
            const totalCrewCost = baseCost + r.totalOTCost;
            const hasOT = r.totalOTCost > 0;

            return (
              <div
                key={r.crewId}
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: r.isCompliant ? '#E2E8F0' : '#FECACA' }}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 text-sm bg-white px-4 py-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: r.isCompliant ? '#10B981' : '#EF4444' }}
                  />
                  <span className="font-bold text-[#2D2D2D] min-w-[130px]">{crew.nombre}</span>
                  <span className="text-[#94A3B8] hidden sm:inline text-xs">
                    {r.effectiveShiftType} · {crew.workers} trab.
                  </span>
                  <span className="text-[#555555] text-xs">{formatHours(r.totalWeeklyHours)} / sem</span>
                  {r.overtimeHours > 0 && (
                    <span className="text-xs font-semibold text-[#F59E0B]">
                      +{formatHours(r.overtimeHours)} TE
                    </span>
                  )}
                  {/* Cost: show total weekly (base + OT) when salary configured, otherwise dash */}
                  {hasSalary ? (
                    <span className="ml-auto font-bold text-[#2D2D2D] text-sm">
                      {formatMXN(totalCrewCost)}
                    </span>
                  ) : (
                    <span className="ml-auto font-bold text-[#94A3B8] text-sm">—</span>
                  )}
                  {!r.isCompliant && (
                    <span
                      className="text-[11px] font-extrabold px-2 py-0.5 rounded-full border"
                      style={{ background: '#FEE2E2', color: '#EF4444', borderColor: '#FECACA' }}
                    >
                      {r.violations.length} {r.violations.length !== 1 ? 'violaciones' : 'violación'}
                    </span>
                  )}
                </div>

                {/* OT cost breakdown sub-row — only when there are extra-hour costs */}
                {hasSalary && hasOT && (
                  <div
                    className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-t text-xs"
                    style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-[#F59E0B] shrink-0" />
                      <span className="text-[#92400E] font-semibold">Costo extra:</span>
                    </div>
                    <span className="text-[#555555]">
                      Dobles (2×):&nbsp;
                      <span className="font-bold text-[#F59E0B]">{formatMXN(r.doubleCost)}</span>
                    </span>
                    {r.tripleCost > 0 && (
                      <span className="text-[#555555]">
                        Triples (3×):&nbsp;
                        <span className="font-bold text-[#EF4444]">{formatMXN(r.tripleCost)}</span>
                      </span>
                    )}
                    <span className="ml-auto text-[#92400E] font-extrabold">
                      Total extra:&nbsp;{formatMXN(r.totalOTCost)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grand total row — only when salary is configured */}
        {hasSalary && (
          <div
            className="mt-3 rounded-xl overflow-hidden border"
            style={{ borderColor: totalOTCost > 0 ? '#FDE68A' : '#A7F3D0' }}
          >
            {/* Total payroll line */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: totalOTCost > 0 ? '#FFFBEB' : '#F0FDF4' }}
            >
              <span
                className="text-xs font-extrabold uppercase tracking-wide"
                style={{ color: totalOTCost > 0 ? '#92400E' : '#065F46' }}
              >
                Costo total semanal de nómina
              </span>
              <span
                className="text-lg font-extrabold"
                style={{ color: totalOTCost > 0 ? '#92400E' : '#065F46' }}
              >
                {formatMXN(totalWeeklyPayroll)}
              </span>
            </div>
            {/* Extra-cost callout — only when there is OT */}
            {totalOTCost > 0 && (
              <div
                className="flex items-center justify-between px-4 py-2 border-t"
                style={{ borderColor: '#FDE68A', background: '#FEF3C7' }}
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span className="text-xs text-[#92400E]">
                    Del cual, costo adicional por horas extraordinarias
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#F59E0B]">
                  {formatMXN(totalOTCost)}
                </span>
              </div>
            )}
          </div>
        )}
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
