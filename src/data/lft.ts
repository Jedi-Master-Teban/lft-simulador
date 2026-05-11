// ── Types ──────────────────────────────────────────────────────────────────

export type ShiftType = 'Diurna' | 'Mixta' | 'Nocturna';
export type LFTYear = 2026 | 2027 | 2028 | 2029 | 2030;

export const LFT_YEARS: LFTYear[] = [2026, 2027, 2028, 2029, 2030];
export const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'] as const;

export interface DaySchedule {
  start: string; // "HH:MM" or "" (rest day)
  end: string;   // "HH:MM" or ""
}

export type WeekSchedule = [
  DaySchedule, DaySchedule, DaySchedule, DaySchedule,
  DaySchedule, DaySchedule, DaySchedule
]; // Mon → Sun

export interface Crew {
  id: string;
  nombre: string;
  shiftType: ShiftType;      // used only when shiftOverride = true
  shiftOverride: boolean;    // user manually set shiftType
  workers: number;
  schedule: WeekSchedule;
}

export interface FirmConfig {
  razonSocial: string;
  planta: string;
  year: LFTYear;
  salarioDiario: number;
}

export interface AppState {
  firm: FirmConfig;
  crews: Crew[];
}

// ── LFT Reference Table ────────────────────────────────────────────────────
// Source: Arts. 60–68 LFT + Constitutional reform 2026–2030

interface YearRef {
  Diurna: number;   // max regular weekly hours for jornada diurna
  Mixta: number;    // max regular weekly hours for jornada mixta
  Nocturna: number; // max regular weekly hours for jornada nocturna
  maxDouble: number; // max double-time (2×) hours per week — Art. 67
  maxTriple: number; // max triple-time (3×) hours per week — Art. 68 (always 4)
}

export const REFERENCE: Record<LFTYear, YearRef> = {
  2026: { Diurna: 48, Mixta: 45, Nocturna: 42, maxDouble: 9,  maxTriple: 4 },
  2027: { Diurna: 46, Mixta: 45, Nocturna: 42, maxDouble: 9,  maxTriple: 4 },
  2028: { Diurna: 44, Mixta: 44, Nocturna: 42, maxDouble: 10, maxTriple: 4 },
  2029: { Diurna: 42, Mixta: 42, Nocturna: 42, maxDouble: 11, maxTriple: 4 },
  2030: { Diurna: 40, Mixta: 40, Nocturna: 40, maxDouble: 12, maxTriple: 4 },
};

// Regular daily maximums by shift type — Art. 61 LFT
export const DAILY_REGULAR_MAX: Record<ShiftType, number> = {
  Diurna:   8,
  Mixta:    7.5,
  Nocturna: 7,
};

export const MAX_DAILY_ABS = 12;          // Absolute daily max — Art. 68
export const MAX_EXTRAORDINARY_DAYS = 4; // Max days with extraordinary shift — Art. 66

// ── Time helpers ───────────────────────────────────────────────────────────

/** Convert "HH:MM" string to minutes since midnight */
export function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Hours worked in a single day.
 * Handles overnight shifts (end < start → shift crosses midnight).
 */
export function getDayHours(day: DaySchedule): number {
  if (!day.start || !day.end) return 0;
  const start = timeToMinutes(day.start);
  let end = timeToMinutes(day.end);
  if (end <= start) end += 1440; // overnight: add 24 hours
  return (end - start) / 60;
}

/**
 * Minutes of a shift that fall in the nocturna window (22:00–06:00).
 * Used for Art. 60 LFT shift-type classification.
 *
 * Extended-space representation: overnight shifts have endMin > 1440.
 * Nocturna sub-windows in this space:
 *   [0, 360]     → 00:00–06:00 (same day early morning)
 *   [1320, 1800] → 22:00 day-0 to 06:00 day-1
 */
export function getNocturnaMinutes(day: DaySchedule): number {
  if (!day.start || !day.end) return 0;
  const start = timeToMinutes(day.start);
  let end = timeToMinutes(day.end);
  if (end <= start) end += 1440;

  const ov = (s: number, e: number, ws: number, we: number) =>
    Math.max(0, Math.min(e, we) - Math.max(s, ws));

  return ov(start, end, 0, 360) + ov(start, end, 1320, 1800);
}

/**
 * Auto-detect shift type from a week's schedule per Art. 60 LFT.
 * Rule: if > 3.5 hours (210 min) of a shift fall in nocturna window → Nocturna.
 *       if any nocturna minutes but ≤ 3.5h              → Mixta.
 *       otherwise                                        → Diurna.
 * The strictest classification across all worked days wins.
 */
export function detectShiftType(schedule: WeekSchedule): ShiftType {
  let hasNocturna = false;
  let hasMixta = false;

  for (const day of schedule) {
    if (!day.start || !day.end) continue;
    const noc = getNocturnaMinutes(day);
    if (noc > 210) { hasNocturna = true; break; }
    if (noc > 0) hasMixta = true;
  }

  if (hasNocturna) return 'Nocturna';
  if (hasMixta) return 'Mixta';
  return 'Diurna';
}

// ── Result types ───────────────────────────────────────────────────────────

export interface Violation {
  article: string;
  description: string;
}

export interface CrewResult {
  crewId: string;
  detectedShiftType: ShiftType;
  effectiveShiftType: ShiftType;
  legalMaxHours: number;      // regular weekly max for this shift type & year
  totalWeeklyHours: number;
  overtimeHours: number;
  doubleHours: number;        // overtime paid at 2× (horas dobles)
  tripleHours: number;        // overtime paid at 3× (horas triples)
  maxDailyHours: number;
  daysWithOvertime: number;
  dailyHours: number[];       // 7 values, Mon–Sun
  doubleCost: number;         // MXN weekly cost of double-time
  tripleCost: number;         // MXN weekly cost of triple-time
  totalOTCost: number;
  violations: Violation[];
  isCompliant: boolean;
}

// ── Main calculation ───────────────────────────────────────────────────────

export function calculateCrewResult(crew: Crew, firm: FirmConfig): CrewResult {
  const ref = REFERENCE[firm.year];
  const detectedShiftType = detectShiftType(crew.schedule);
  const effectiveShiftType = crew.shiftOverride ? crew.shiftType : detectedShiftType;
  const legalMaxHours = ref[effectiveShiftType];
  const dailyMax = DAILY_REGULAR_MAX[effectiveShiftType];

  const dailyHours = crew.schedule.map(d => getDayHours(d));
  const totalWeeklyHours = dailyHours.reduce((a, b) => a + b, 0);
  const maxDailyHours = Math.max(...dailyHours, 0);
  const daysWithOvertime = dailyHours.filter(h => h > dailyMax).length;

  // Overtime breakdown — Arts. 67–68 LFT
  const overtimeHours = Math.max(0, totalWeeklyHours - legalMaxHours);
  const doubleHours = Math.min(overtimeHours, ref.maxDouble);
  const tripleHours =
    overtimeHours > ref.maxDouble
      ? Math.min(overtimeHours - ref.maxDouble, ref.maxTriple)
      : 0;

  // Cost calculation: (salario_diario / 8) × hours × multiplier × workers
  const hourlyRate = firm.salarioDiario / 8;
  const doubleCost = hourlyRate * doubleHours * 2 * crew.workers;
  const tripleCost = hourlyRate * tripleHours * 3 * crew.workers;
  const totalOTCost = doubleCost + tripleCost;

  // Compliance checks
  const totalMaxHours = legalMaxHours + ref.maxDouble + ref.maxTriple;
  const violations: Violation[] = [];

  if (totalWeeklyHours > totalMaxHours) {
    violations.push({
      article: 'Art. 59, 66 y 68',
      description: `Jornada semanal (${totalWeeklyHours.toFixed(1)}h) excede el máximo de ${totalMaxHours}h para ${effectiveShiftType.toLowerCase()} en ${firm.year}.`,
    });
  }

  if (maxDailyHours > MAX_DAILY_ABS) {
    violations.push({
      article: 'Art. 68',
      description: `Jornada diaria máxima (${maxDailyHours.toFixed(1)}h) excede el límite absoluto de ${MAX_DAILY_ABS}h.`,
    });
  }

  if (daysWithOvertime > MAX_EXTRAORDINARY_DAYS) {
    violations.push({
      article: 'Art. 66',
      description: `${daysWithOvertime} días con jornada extraordinaria; el máximo permitido es ${MAX_EXTRAORDINARY_DAYS} días por semana.`,
    });
  }

  if (tripleHours > ref.maxTriple) {
    violations.push({
      article: 'Art. 68',
      description: `Horas triples (${tripleHours.toFixed(1)}h) exceden el máximo legal de ${ref.maxTriple}h semanales.`,
    });
  }

  return {
    crewId: crew.id,
    detectedShiftType,
    effectiveShiftType,
    legalMaxHours,
    totalWeeklyHours,
    overtimeHours,
    doubleHours,
    tripleHours,
    maxDailyHours,
    daysWithOvertime,
    dailyHours,
    doubleCost,
    tripleCost,
    totalOTCost,
    violations,
    isCompliant: violations.length === 0,
  };
}

// ── Factory functions ──────────────────────────────────────────────────────

export function createDefaultCrew(index: number): Crew {
  return {
    id: crypto.randomUUID(),
    nombre: `Tripulación ${String.fromCharCode(65 + index)}`, // A, B, C…
    shiftType: 'Diurna',
    shiftOverride: false,
    workers: 10,
    schedule: [
      { start: '07:00', end: '15:00' }, // Lunes
      { start: '07:00', end: '15:00' }, // Martes
      { start: '07:00', end: '15:00' }, // Miércoles
      { start: '07:00', end: '15:00' }, // Jueves
      { start: '07:00', end: '15:00' }, // Viernes
      { start: '07:00', end: '15:00' }, // Sábado
      { start: '', end: '' },            // Domingo (descanso)
    ],
  };
}

export const DEFAULT_FIRM: FirmConfig = {
  razonSocial: '',
  planta: '',
  year: 2026,
  salarioDiario: 500,
};

export function createDefaultState(): AppState {
  return {
    firm: DEFAULT_FIRM,
    crews: [createDefaultCrew(0), createDefaultCrew(1)],
  };
}

// ── Formatting helpers ─────────────────────────────────────────────────────

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHours(h: number): string {
  if (h === 0) return '0h';
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}m`;
}
