import { useState } from 'react';
import { Trash2, Users, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
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

const SHIFT_STYLE: Record<ShiftType, { bg: string; text: string; border: string; icon: string }> = {
  Diurna:   { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: '☀️' },
  Mixta:    { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', icon: '🌗' },
  Nocturna: { bg: '#EFF6FF', text: '#1E3A8A', border: '#BFDBFE', icon: '🌙' },
};

export function CrewCard({ crew, result, firm, onUpdate, onDelete }: Props) {
  const [showSchedule, setShowSchedule] = useState(true);
  const [editingOverride, setEditingOverride] = useState(false);

  const ref = REFERENCE[firm.year];
  const { effectiveShiftType, detectedShiftType, isCompliant, violations, legalMaxHours, totalWeeklyHours } = result;
  const shift = SHIFT_STYLE[effectiveShiftType];

  // 4-state colour model: blue → green → yellow → red
  const doubleEnd = legalMaxHours + ref.maxDouble;
  const totalMax = legalMaxHours + ref.maxDouble + ref.maxTriple;
  const isGreen = totalWeeklyHours > legalMaxHours && totalWeeklyHours <= doubleEnd;  // with extras (double-time)
  const isAmber = totalWeeklyHours > doubleEnd && totalWeeklyHours <= totalMax;        // near limit (triple-time)
  const isRed   = totalWeeklyHours > totalMax;                                         // exceeds all permitted

  const borderColor = isRed || !isCompliant ? '#EF4444' : isAmber ? '#F59E0B' : isGreen ? '#10B981' : '#3B82F6';
  const dotColor    = borderColor;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{
        borderLeft: `4px solid ${borderColor}`,
        border: `1px solid #E2E8F0`,
        borderLeftWidth: '4px',
        borderLeftColor: borderColor,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Card header ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status dot */}
          <div
            className="mt-1 w-3 h-3 rounded-full shrink-0 transition-colors"
            style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotColor}33` }}
          />

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={crew.nombre}
              onChange={e => onUpdate({ ...crew, nombre: e.target.value })}
              className="text-base font-extrabold bg-transparent border-none focus:outline-none focus:underline w-full text-[#2D2D2D]"
            />

            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border"
                style={{ background: shift.bg, color: shift.text, borderColor: shift.border }}
              >
                {shift.icon} {effectiveShiftType}
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                {crew.shiftOverride ? '(sobreescrito)' : '(auto-detectado)'}
              </span>

              {!editingOverride ? (
                <button
                  onClick={() => setEditingOverride(true)}
                  className="text-[11px] underline font-semibold transition-colors"
                  style={{ color: '#1BBBEE' }}
                >
                  cambiar
                </button>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  {(['Diurna', 'Mixta', 'Nocturna'] as ShiftType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => { onUpdate({ ...crew, shiftType: t, shiftOverride: true }); setEditingOverride(false); }}
                      className="text-[11px] px-2 py-0.5 rounded-full border font-semibold transition-all"
                      style={t === effectiveShiftType
                        ? { background: '#1BBBEE', color: '#fff', borderColor: '#1BBBEE' }
                        : { background: '#fff', color: '#555555', borderColor: '#E2E8F0' }}
                    >
                      {SHIFT_STYLE[t].icon} {t}
                    </button>
                  ))}
                  {crew.shiftOverride && (
                    <button
                      onClick={() => { onUpdate({ ...crew, shiftType: detectedShiftType, shiftOverride: false }); setEditingOverride(false); }}
                      className="text-[11px] underline text-[#94A3B8] ml-1"
                    >
                      auto
                    </button>
                  )}
                  <button onClick={() => setEditingOverride(false)} className="text-[11px] text-[#94A3B8] ml-1">✕</button>
                </div>
              )}

              <div className="flex items-center gap-1 ml-auto">
                <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
                <input
                  type="number"
                  value={crew.workers}
                  onChange={e => onUpdate({ ...crew, workers: Math.max(1, Number(e.target.value)) })}
                  min="1"
                  className="w-14 text-sm text-right bg-transparent border-b border-dashed border-[#E2E8F0] focus:outline-none focus:border-[#1BBBEE] text-[#2D2D2D]"
                />
                <span className="text-xs text-[#94A3B8]">trabajadores</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onDelete}
          title="Eliminar tripulación"
          className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEE2E2] transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Compliance progress bar ───────────────────────────────────── */}
      <ComplianceBar
        totalHours={totalWeeklyHours}
        legalMax={legalMaxHours}
        doubleEnd={doubleEnd}
        totalMax={totalMax}
      />

      {/* ── Schedule toggle ───────────────────────────────────────────── */}
      <button
        onClick={() => setShowSchedule(s => !s)}
        className="w-full flex items-center justify-between px-5 py-2 border-y border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: '#1BBBEE' }}>
            Horario Semanal
          </span>

          {/* ── Art. 63/64 tooltip ──────────────────────────────────── */}
          <div
            className="relative flex items-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="group flex items-center">
              <Info
                className="w-3.5 h-3.5 cursor-default"
                style={{ color: '#94A3B8' }}
              />
              {/* Tooltip panel */}
              <div
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 z-20
                            w-72 opacity-0 group-hover:opacity-100
                            transition-opacity duration-150"
              >
                <div
                  className="rounded-xl px-3.5 py-3 text-[11px] leading-relaxed shadow-lg"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #BAE6FD',
                    color: '#334155',
                    boxShadow: '0 4px 16px rgba(27,187,238,0.12)',
                  }}
                >
                  <p className="font-bold mb-1" style={{ color: '#1BBBEE' }}>
                    Jornada y descanso para comida
                  </p>
                  <p className="mb-1.5">
                    Las horas se calculan sobre el tiempo total entre entrada y salida.
                    El descanso para comer que ocurre <strong>dentro</strong> de ese
                    periodo ya está incluido en la jornada.
                  </p>
                  <p className="mb-1.5">
                    <strong>Art. 63 LFT —</strong> Durante la jornada continua se
                    concederá al trabajador un descanso de media hora, por lo menos.
                  </p>
                  <p>
                    <strong>Art. 64 LFT —</strong> Cuando el trabajador no pueda salir
                    del lugar donde presta sus servicios durante el descanso —incluyendo
                    la <strong>hora de almuerzo</strong>—, ese tiempo se computa como{' '}
                    <strong>tiempo efectivo de jornada</strong>. Por ello, los acuerdos
                    de media hora, una hora u otro tiempo destinado al almuerzo no
                    afectan el cálculo de las horas efectivas registradas en esta
                    herramienta.
                  </p>
                </div>
                {/* Arrow */}
                <div
                  className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45"
                  style={{ background: '#FFFFFF', borderLeft: '1px solid #BAE6FD', borderBottom: '1px solid #BAE6FD' }}
                />
              </div>
            </div>
          </div>
        </div>

        {showSchedule
          ? <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" />
          : <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />}
      </button>

      {showSchedule && (
        <div className="px-5 py-4">
          <ScheduleGrid
            schedule={crew.schedule}
            dailyHours={result.dailyHours}
            onChange={schedule => onUpdate({ ...crew, schedule })}
          />
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      <div className="border-t border-[#E2E8F0] px-5 py-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox
            label="Total semanal"
            value={formatHours(totalWeeklyHours)}
            sub={`Máx. legal: ${legalMaxHours}h`}
            state={totalWeeklyHours > legalMaxHours ? (isRed ? 'error' : 'warn') : 'ok'}
          />
          <StatBox
            label="Tiempo extra"
            value={formatHours(result.overtimeHours)}
            sub={result.overtimeHours > 0 ? 'sobre jornada' : 'sin tiempo extra'}
            state={result.overtimeHours > 0 ? 'warn' : 'ok'}
          />
          <StatBox
            label="Horas dobles (2×)"
            value={formatHours(result.doubleHours)}
            sub={`Máx. ${ref.maxDouble}h — Art. 67`}
            state={result.doubleHours > 0 ? 'warn' : 'ok'}
          />
          <StatBox
            label="Horas triples (3×)"
            value={formatHours(result.tripleHours)}
            sub={`Máx. ${ref.maxTriple}h — Art. 68`}
            state={result.tripleHours > 0 ? 'error' : 'ok'}
          />
        </div>

        {/* Cost strip — always visible when a salary is configured */}
        {firm.salarioDiario > 0 && (
          <div
            className="rounded-xl border overflow-hidden text-sm"
            style={{ borderColor: result.totalOTCost > 0 ? '#FDE68A' : '#A7F3D0' }}
          >
            {result.totalOTCost > 0 ? (
              <>
                {/* Breakdown row */}
                <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <span>
                    <span className="text-xs text-[#94A3B8]">Dobles (2×): </span>
                    <span className="font-bold text-[#F59E0B]">{formatMXN(result.doubleCost)}</span>
                  </span>
                  <span>
                    <span className="text-xs text-[#94A3B8]">Triples (3×): </span>
                    <span className="font-bold text-[#EF4444]">{formatMXN(result.tripleCost)}</span>
                  </span>
                </div>
                {/* Extra-cost total row */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: '#FFFBEB' }}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide block text-[#92400E]">
                        Costo Semanal
                      </span>
                      <span className="text-[10px] text-[#B45309]">
                        Costo adicional por horas extraordinarias
                      </span>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-[#92400E]">
                    {formatMXN(result.totalOTCost)}
                  </span>
                </div>
              </>
            ) : (
              /* No overtime — show $0 with a positive indicator */
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: '#F0FDF4' }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide block text-[#065F46]">
                      Costo Semanal
                    </span>
                    <span className="text-[10px] text-[#10B981]">
                      Sin horas extraordinarias
                    </span>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-[#10B981]">
                  {formatMXN(0)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Compliance */}
        {isCompliant ? (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border" style={{ background: '#D1FAE5', borderColor: '#A7F3D0' }}>
            <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981]" />
            <span className="text-sm font-semibold text-[#065F46]">
              Cumple con la jornada legal para {firm.year}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {violations.map((v, idx) => (
              <div key={idx} className="flex items-start gap-2.5 px-4 py-3 rounded-xl border" style={{ background: '#FEE2E2', borderColor: '#FECACA' }}>
                <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-extrabold text-[#EF4444] uppercase tracking-wider block">{v.article}</span>
                  <span className="text-sm text-[#991B1B]">{v.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
//
// Layout (three separate rows — zero overlap possible):
//
//   ROW 1 (20px): current-hours pill floating above the fill endpoint
//   ROW 2 (10px): the bar track with coloured zones + animated fill
//   ROW 3 (18px): static threshold tick labels below the bar
//

function ComplianceBar({ totalHours, legalMax, doubleEnd, totalMax }: {
  totalHours: number; legalMax: number; doubleEnd: number; totalMax: number;
}) {
  // Dynamic cap: expands beyond totalMax when hours exceed it
  const cap = Math.max(totalMax, totalHours);

  // 4 zone widths (blue / green / yellow / red)
  const blueW  = (legalMax / cap) * 100;
  const greenW = ((doubleEnd - legalMax) / cap) * 100;
  const amberW = ((totalMax - doubleEnd) / cap) * 100;
  // When totalHours > totalMax the bar still fills to 100 % and the remaining
  // space is implicitly red (flex: 1 div below)

  const fillPct = Math.min((totalHours / cap) * 100, 100);

  // Fill colour follows the 4-state model
  const fillColor =
    totalHours <= legalMax  ? '#3B82F6' :   // blue  — below extras
    totalHours <= doubleEnd ? '#10B981' :   // green — with extras (double-time)
    totalHours <= totalMax  ? '#F59E0B' :   // yellow — near limit (triple-time)
                              '#EF4444';    // red   — exceeds all permitted

  const hoursLabel = totalHours > 0
    ? `${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h`
    : '';

  // Keep pill inside track bounds (5 % – 96 %)
  const pillLeft = `${Math.min(Math.max(fillPct, 5), 96)}%`;

  return (
    <div className="px-5 pb-2 pt-1 select-none">

      {/* ── ROW 1: current-hours pill ──────────────────────────────── */}
      <div className="relative h-5 mb-0.5">
        {hoursLabel && (
          <span
            className="absolute -translate-x-1/2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md
                       transition-all duration-500 whitespace-nowrap"
            style={{
              left: pillLeft,
              bottom: 0,
              color: fillColor,
              background: `${fillColor}18`,
              border: `1px solid ${fillColor}40`,
            }}
          >
            {hoursLabel}
          </span>
        )}
      </div>

      {/* ── ROW 2: bar track (4 zones) ────────────────────────────── */}
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {/* Zone backgrounds */}
        <div style={{ width: `${blueW}%`,  background: '#DBEAFE' }} />   {/* blue  */}
        <div style={{ width: `${greenW}%`, background: '#D1FAE5' }} />   {/* green */}
        <div style={{ width: `${amberW}%`, background: '#FEF3C7' }} />   {/* yellow */}
        {totalHours > totalMax && <div style={{ flex: 1, background: '#FEE2E2' }} />}  {/* red overflow */}

        {/* Animated fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${fillPct}%`, background: fillColor, opacity: 0.82 }}
        />

        {/* Thin white dividers at the 3 zone boundaries */}
        {[blueW, blueW + greenW, blueW + greenW + amberW].map((pos, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${pos}%` }} />
        ))}
      </div>

      {/* ── ROW 3: threshold labels ───────────────────────────────── */}
      <div className="relative mt-1.5 h-4">
        {/* 0h — hard left */}
        <span className="absolute left-0 text-[9px] font-semibold text-[#CBD5E1]">0h</span>

        {/* Legal max — blue boundary */}
        <span
          className="absolute -translate-x-1/2 text-[9px] font-bold"
          style={{ left: `${blueW}%`, color: '#3B82F6' }}
        >
          {legalMax}h
        </span>

        {/* Double-time end — green/yellow boundary */}
        <span
          className="absolute -translate-x-1/2 text-[9px] font-bold"
          style={{ left: `${Math.min(blueW + greenW, 88)}%`, color: '#10B981' }}
        >
          {doubleEnd}h
        </span>

        {/* Total max — moves left when bar extends beyond it */}
        {totalHours > totalMax ? (
          <span
            className="absolute -translate-x-1/2 text-[9px] font-bold text-[#F59E0B]"
            style={{ left: `${blueW + greenW + amberW}%` }}
          >
            {totalMax}h
          </span>
        ) : (
          <span className="absolute right-0 text-[9px] font-bold text-[#F59E0B]">
            {totalMax}h
          </span>
        )}

        {/* Actual hours at the right edge — only visible when exceeding totalMax */}
        {totalHours > totalMax && (
          <span className="absolute right-0 text-[9px] font-bold text-[#EF4444]">
            {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h
          </span>
        )}
      </div>

    </div>
  );
}

// ── Stat box ───────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, state }: { label: string; value: string; sub: string; state: 'ok' | 'warn' | 'error' }) {
  const color = state === 'ok' ? '#2D2D2D' : state === 'warn' ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{label}</span>
      <span className="text-xl font-extrabold transition-colors" style={{ color }}>{value}</span>
      <span className="text-[11px] text-[#94A3B8]">{sub}</span>
    </div>
  );
}
