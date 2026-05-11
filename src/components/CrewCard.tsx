import { useState } from 'react';
import { Trash2, Users, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { Crew, CrewResult, FirmConfig, ShiftType } from '../data/lft';
import { REFERENCE, formatMXN, formatHours } from '../data/lft';
import { ScheduleGrid } from './ScheduleGrid';

interface Props {
  crew: Crew;
  result: CrewResult;
  firm: FirmConfig;
  onUpdate: (crew: Crew) => void;
  onDelete: () => void;
}

const SHIFT_COLORS: Record<ShiftType, string> = {
  Diurna:   'bg-amber-50 text-amber-700 border-amber-200',
  Mixta:    'bg-violet-50 text-violet-700 border-violet-200',
  Nocturna: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const SHIFT_ICONS: Record<ShiftType, string> = {
  Diurna:   '☀️',
  Mixta:    '🌗',
  Nocturna: '🌙',
};

export function CrewCard({ crew, result, firm, onUpdate, onDelete }: Props) {
  const [showSchedule, setShowSchedule] = useState(true);
  const [editingOverride, setEditingOverride] = useState(false);

  const ref = REFERENCE[firm.year];
  const { effectiveShiftType, detectedShiftType, isCompliant, violations } = result;

  const updateSchedule = (schedule: Crew['schedule']) =>
    onUpdate({ ...crew, schedule });

  const setOverrideShift = (type: ShiftType) => {
    onUpdate({ ...crew, shiftType: type, shiftOverride: true });
    setEditingOverride(false);
  };

  const clearOverride = () => {
    onUpdate({ ...crew, shiftType: detectedShiftType, shiftOverride: false });
    setEditingOverride(false);
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
        isCompliant ? 'border-slate-200' : 'border-red-200'
      }`}
    >
      {/* ── Card header ──────────────────────────────────────────────── */}
      <div
        className={`px-5 py-4 flex items-start justify-between gap-4 ${
          isCompliant ? 'bg-white' : 'bg-red-50'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Compliance indicator */}
          <div
            className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${
              isCompliant ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />

          <div className="flex-1 min-w-0">
            {/* Crew name */}
            <input
              type="text"
              value={crew.nombre}
              onChange={e => onUpdate({ ...crew, nombre: e.target.value })}
              className="text-base font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:underline w-full"
            />

            {/* Shift type + workers */}
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              {/* Shift type badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${SHIFT_COLORS[effectiveShiftType]}`}
                >
                  <span>{SHIFT_ICONS[effectiveShiftType]}</span>
                  {effectiveShiftType}
                </span>
                {crew.shiftOverride && (
                  <span className="text-[10px] text-slate-400">(sobreescrito)</span>
                )}
                {!crew.shiftOverride && (
                  <span className="text-[10px] text-slate-400">(auto)</span>
                )}
              </div>

              {/* Override controls */}
              {!editingOverride ? (
                <button
                  onClick={() => setEditingOverride(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline transition-colors"
                >
                  cambiar
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  {(['Diurna', 'Mixta', 'Nocturna'] as ShiftType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setOverrideShift(t)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        t === effectiveShiftType
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {crew.shiftOverride && (
                    <button
                      onClick={clearOverride}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1"
                    >
                      auto
                    </button>
                  )}
                  <button
                    onClick={() => setEditingOverride(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 ml-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Workers */}
              <div className="flex items-center gap-1 ml-auto">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  value={crew.workers}
                  onChange={e => onUpdate({ ...crew, workers: Math.max(1, Number(e.target.value)) })}
                  min="1"
                  className="w-14 text-sm text-slate-700 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-slate-500"
                />
                <span className="text-xs text-slate-500">trabajadores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          title="Eliminar tripulación"
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Schedule toggle ───────────────────────────────────────────── */}
      <button
        onClick={() => setShowSchedule(s => !s)}
        className="w-full flex items-center justify-between px-5 py-2 bg-slate-50 border-y border-slate-100 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Horario semanal
        </span>
        {showSchedule
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {/* ── Schedule grid ─────────────────────────────────────────────── */}
      {showSchedule && (
        <div className="px-5 py-4">
          <ScheduleGrid
            schedule={crew.schedule}
            dailyHours={result.dailyHours}
            onChange={updateSchedule}
          />
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-5 py-4">
        {/* Hours summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat
            label="Total semanal"
            value={formatHours(result.totalWeeklyHours)}
            sub={`Máx. legal: ${ref[effectiveShiftType]}h`}
            highlight={result.totalWeeklyHours > ref[effectiveShiftType] ? 'warn' : 'ok'}
          />
          <Stat
            label="Tiempo extra"
            value={formatHours(result.overtimeHours)}
            sub={result.overtimeHours > 0 ? 'sobre jornada legal' : 'sin tiempo extra'}
            highlight={result.overtimeHours > 0 ? 'warn' : 'ok'}
          />
          <Stat
            label="Horas dobles (2×)"
            value={formatHours(result.doubleHours)}
            sub={`Máx. ${ref.maxDouble}h — Art. 67`}
            highlight={result.doubleHours > 0 ? 'warn' : 'ok'}
          />
          <Stat
            label="Horas triples (3×)"
            value={formatHours(result.tripleHours)}
            sub={`Máx. ${ref.maxTriple}h — Art. 68`}
            highlight={result.tripleHours > 0 ? 'error' : 'ok'}
          />
        </div>

        {/* Cost row */}
        {firm.salarioDiario > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
            <div>
              <span className="text-slate-500 text-xs">Costo dobles:</span>{' '}
              <span className="font-semibold text-amber-700">{formatMXN(result.doubleCost)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Costo triples:</span>{' '}
              <span className="font-semibold text-red-700">{formatMXN(result.tripleCost)}</span>
            </div>
            <div className="sm:ml-auto">
              <span className="text-slate-500 text-xs">Costo TE semanal:</span>{' '}
              <span className="font-bold text-slate-800">{formatMXN(result.totalOTCost)}</span>
            </div>
          </div>
        )}

        {/* Compliance */}
        {isCompliant ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-emerald-500 text-base">✓</span>
            <span className="text-sm font-medium text-emerald-700">
              Cumple con la jornada legal en {firm.year}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {violations.map((v, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
                    {v.article}
                  </span>
                  <span className="text-sm text-red-700">{v.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat helper component ──────────────────────────────────────────────────

interface StatProps {
  label: string;
  value: string;
  sub: string;
  highlight: 'ok' | 'warn' | 'error';
}

function Stat({ label, value, sub, highlight }: StatProps) {
  const valueColor =
    highlight === 'ok'
      ? 'text-slate-800'
      : highlight === 'warn'
      ? 'text-amber-700'
      : 'text-red-600';

  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className={`text-xl font-bold ${valueColor}`}>{value}</span>
      <span className="text-[11px] text-slate-400 mt-0.5">{sub}</span>
    </div>
  );
}
