// ── Types ──────────────────────────────────────────────────────────────────

export type ShiftType = 'Diurna' | 'Mixta' | 'Nocturna';
export type LFTYear = 2026 | 2027 | 2028 | 2029 | 2030;

export const LFT_YEARS: LFTYear[] = [2026, 2027, 2028, 2029, 2030];
export const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'] as const;

export interface DaySchedule {
  start: string;        // "HH:MM"
  end: string;          // "HH:MM"
  rest?: boolean;       // explicit rest flag (undefined treated as false for backwards-compat)
}

export type WeekSchedule = [
  DaySchedule, DaySchedule, DaySchedule, DaySchedule,
  DaySchedule, DaySchedule, DaySchedule
]; // Mon → Sun

export interface Crew {
  id: string;
  nombre: string;
  shiftType: ShiftType;
  shiftOverride: boolean;
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

interface YearRef {
  Diurna: number;
  Mixta: number;
  Nocturna: number;
  maxDouble: number;
  maxTriple: number;
}

export const REFERENCE: Record<LFTYear, YearRef> = {
  2026: { Diurna: 48, Mixta: 45, Nocturna: 42, maxDouble: 9,  maxTriple: 4 },
  2027: { Diurna: 46, Mixta: 45, Nocturna: 42, maxDouble: 9,  maxTriple: 4 },
  2028: { Diurna: 44, Mixta: 44, Nocturna: 42, maxDouble: 10, maxTriple: 4 },
  2029: { Diurna: 42, Mixta: 42, Nocturna: 42, maxDouble: 11, maxTriple: 4 },
  2030: { Diurna: 40, Mixta: 40, Nocturna: 40, maxDouble: 12, maxTriple: 4 },
};

export const DAILY_REGULAR_MAX: Record<ShiftType, number> = {
  Diurna:   8,
  Mixta:    7.5,
  Nocturna: 7,
};

export const MAX_DAILY_ABS = 12;
export const MAX_EXTRAORDINARY_DAYS = 4;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Whether a day should be counted as worked (not a rest day) */
export function isDayActive(day: DaySchedule): boolean {
  // rest flag takes priority; if undefined, fall back to empty-string detection
  if (day.rest === true) return false;
  if (day.rest === false) return true;
  return Boolean(day.start && day.end); // backwards-compat for old localStorage data
}

export function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getDayHours(day: DaySchedule): number {
  if (!isDayActive(day)) return 0;
  if (!day.start || !day.end) return 0;
  const start = timeToMinutes(day.start);
  let end = timeToMinutes(day.end);
  if (end <= start) end += 1440;
  return (end - start) / 60;
}

export function getNocturnaMinutes(day: DaySchedule): number {
  if (!isDayActive(day)) return 0;
  if (!day.start || !day.end) return 0;
  const start = timeToMinutes(day.start);
  let end = timeToMinutes(day.end);
  if (end <= start) end += 1440;
  const ov = (s: number, e: number, ws: number, we: number) =>
    Math.max(0, Math.min(e, we) - Math.max(s, ws));
  return ov(start, end, 0, 360) + ov(start, end, 1320, 1800);
}

export function detectShiftType(schedule: WeekSchedule): ShiftType {
  let hasNocturna = false;
  let hasMixta = false;
  for (const day of schedule) {
    if (!isDayActive(day)) continue;
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
  legalMaxHours: number;
  totalWeeklyHours: number;
  overtimeHours: number;
  doubleHours: number;
  tripleHours: number;
  maxDailyHours: number;
  daysWithOvertime: number;
  dailyHours: number[];
  doubleCost: number;
  tripleCost: number;
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

  const overtimeHours = Math.max(0, totalWeeklyHours - legalMaxHours);
  const doubleHours = Math.min(overtimeHours, ref.maxDouble);
  const tripleHours =
    overtimeHours > ref.maxDouble
      ? Math.min(overtimeHours - ref.maxDouble, ref.maxTriple)
      : 0;

  const hourlyRate = firm.salarioDiario / 8;
  const doubleCost = hourlyRate * doubleHours * 2 * crew.workers;
  const tripleCost = hourlyRate * tripleHours * 3 * crew.workers;
  const totalOTCost = doubleCost + tripleCost;

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
      description: `Horas triples (${tripleHours.toFixed(1)}h) exceden el máximo de ${ref.maxTriple}h semanales.`,
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

// ── Factories ──────────────────────────────────────────────────────────────

const DEFAULT_TIMES = { start: '07:00', end: '15:00' };

export function createDefaultCrew(index: number): Crew {
  return {
    id: crypto.randomUUID(),
    nombre: `Tripulación ${String.fromCharCode(65 + index)}`,
    shiftType: 'Diurna',
    shiftOverride: false,
    workers: 10,
    schedule: [
      { ...DEFAULT_TIMES, rest: false }, // Lunes
      { ...DEFAULT_TIMES, rest: false }, // Martes
      { ...DEFAULT_TIMES, rest: false }, // Miércoles
      { ...DEFAULT_TIMES, rest: false }, // Jueves
      { ...DEFAULT_TIMES, rest: false }, // Viernes
      { ...DEFAULT_TIMES, rest: false }, // Sábado
      { ...DEFAULT_TIMES, rest: true  }, // Domingo — pre-filled but toggled off
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
  return { firm: DEFAULT_FIRM, crews: [createDefaultCrew(0), createDefaultCrew(1)] };
}

// ── Formatters ─────────────────────────────────────────────────────────────

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHours(h: number): string {
  if (h === 0) return '0h';
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins === 0 ? `${whole}h` : `${whole}h ${mins}m`;
}
