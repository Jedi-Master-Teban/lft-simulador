import { CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import type { Crew, CrewResult, FirmConfig } from '../data/lft';
import { formatMXN, formatHours } from '../data/lft';

interface Props {
  crews: Crew[];
  results: CrewResult[];
  firm: FirmConfig;
}

export function SummaryPanel({ crews, results, firm }: Props) {
  if (crews.length === 0) return null;

  const compliantCount = results.filter(r => r.isCompliant).length;
  const violatingCount = results.length - compliantCount;
  const totalCost = results.reduce((sum, r) => sum + r.totalOTCost, 0);
  const totalWorkers = crews.reduce((sum, c) => sum + c.workers, 0);
  const allCompliant = violatingCount === 0;

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        allCompliant
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 border-b flex items-center gap-2 ${
          allCompliant ? 'border-emerald-200' : 'border-red-200'
        }`}
      >
        {allCompliant ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
        )}
        <h2 className={`text-base font-bold ${allCompliant ? 'text-emerald-800' : 'text-red-800'}`}>
          {allCompliant
            ? 'La empresa está en cumplimiento con la LFT'
            : `Hay ${violatingCount} tripulación${violatingCount > 1 ? 'es' : ''} con incumplimiento`}
        </h2>
        {firm.razonSocial && (
          <span className="ml-auto text-sm font-medium text-slate-600">
            {firm.razonSocial}
            {firm.planta ? ` · ${firm.planta}` : ''}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-slate-200">
        <SummaryTile
          icon={<Users className="w-4 h-4" />}
          label="Total trabajadores"
          value={totalWorkers.toString()}
          sub={`${crews.length} tripulación${crews.length !== 1 ? 'es' : ''}`}
          color="slate"
        />
        <SummaryTile
          icon={<CheckCircle className="w-4 h-4" />}
          label="En cumplimiento"
          value={`${compliantCount} / ${results.length}`}
          sub="tripulaciones"
          color={allCompliant ? 'emerald' : 'slate'}
        />
        {violatingCount > 0 && (
          <SummaryTile
            icon={<XCircle className="w-4 h-4" />}
            label="Con incumplimiento"
            value={violatingCount.toString()}
            sub="tripulaciones"
            color="red"
          />
        )}
        <SummaryTile
          icon={<TrendingUp className="w-4 h-4" />}
          label="Costo TE semanal"
          value={formatMXN(totalCost)}
          sub="todas las tripulaciones"
          color={totalCost > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Per-crew breakdown */}
      <div className="px-5 py-4 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Resumen por tripulación
        </p>
        <div className="space-y-2">
          {results.map((r, i) => {
            const crew = crews[i];
            return (
              <div
                key={r.crewId}
                className="flex items-center gap-3 text-sm bg-white rounded-lg px-4 py-2.5 border border-slate-200"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    r.isCompliant ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                <span className="font-medium text-slate-700 min-w-[140px]">
                  {crew.nombre}
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  {r.effectiveShiftType} · {crew.workers} trab.
                </span>
                <span className="text-slate-700">
                  {formatHours(r.totalWeeklyHours)} / sem
                </span>
                {r.overtimeHours > 0 && (
                  <span className="text-amber-600">
                    +{formatHours(r.overtimeHours)} TE
                  </span>
                )}
                <span className="ml-auto font-semibold text-slate-800">
                  {formatMXN(r.totalOTCost)}
                </span>
                {!r.isCompliant && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
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

// ── Tile helper ────────────────────────────────────────────────────────────

interface TileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'slate' | 'emerald' | 'red' | 'amber';
}

function SummaryTile({ icon, label, value, sub, color }: TileProps) {
  const iconColor = {
    slate:   'text-slate-500',
    emerald: 'text-emerald-600',
    red:     'text-red-500',
    amber:   'text-amber-600',
  }[color];

  const valueColor = {
    slate:   'text-slate-800',
    emerald: 'text-emerald-700',
    red:     'text-red-700',
    amber:   'text-amber-700',
  }[color];

  return (
    <div className="flex flex-col gap-0.5 px-5 py-4 bg-white/60">
      <div className={`flex items-center gap-1.5 ${iconColor}`}>
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
      <span className="text-xs text-slate-400">{sub}</span>
    </div>
  );
}
