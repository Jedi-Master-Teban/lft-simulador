import type { DaySchedule, WeekSchedule } from '../data/lft';
import { getDayHours, isDayActive, DAYS_SHORT } from '../data/lft';

interface Props {
  schedule: WeekSchedule;
  dailyHours: number[];
  onChange: (schedule: WeekSchedule) => void;
}

export function ScheduleGrid({ schedule, dailyHours, onChange }: Props) {
  const update = (i: number, patch: Partial<DaySchedule>) => {
    const next = [...schedule] as WeekSchedule;
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const toggleRest = (i: number) => {
    const day = schedule[i];
    // isDayActive(day) === true  →  currently active  →  set rest: true  (deactivate)
    // isDayActive(day) === false →  currently rest    →  set rest: false (activate)
    update(i, { rest: isDayActive(day) });
    // Note: times are always preserved when toggling
  };

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="flex gap-2 min-w-max">
        {DAYS_SHORT.map((label, i) => {
          const day = schedule[i];
          const active = isDayActive(day);
          const hours = dailyHours[i] ?? getDayHours(day);
          const isOvernight = active && day.start && day.end &&
            getDayHours(day) > (() => {
              const s = day.start.split(':').map(Number);
              const e = day.end.split(':').map(Number);
              return (e[0] * 60 + (e[1] || 0) - (s[0] * 60 + (s[1] || 0))) / 60;
            })();

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 w-[72px]">

              {/* Day label */}
              <span
                className="text-[11px] font-extrabold uppercase tracking-widest transition-colors"
                style={{ color: active ? '#1BBBEE' : '#94A3B8' }}
              >
                {label}
              </span>

              {/* Time input card — all 7 days look identical */}
              <div
                className="w-full rounded-xl transition-all"
                style={{
                  background: active ? '#FFFFFF' : '#F8FAFC',
                  border: active ? '2px solid #1BBBEE' : '1px solid #E2E8F0',
                  boxShadow: active ? '0 0 0 3px rgba(27,187,238,0.1)' : 'none',
                }}
              >
                <input
                  type="time"
                  value={day.start}
                  onChange={e => update(i, { start: e.target.value })}
                  className="w-full text-center text-xs px-1 py-2 rounded-t-xl bg-transparent focus:outline-none"
                  style={{ color: active ? '#2D2D2D' : '#94A3B8' }}
                />
                <div className="border-t mx-1" style={{ borderColor: active ? '#E0F5FD' : '#E2E8F0' }} />
                <input
                  type="time"
                  value={day.end}
                  onChange={e => update(i, { end: e.target.value })}
                  className="w-full text-center text-xs px-1 py-2 rounded-b-xl bg-transparent focus:outline-none"
                  style={{ color: active ? '#2D2D2D' : '#94A3B8' }}
                />
              </div>

              {/* Hours badge */}
              <span
                className="text-xs font-bold transition-colors"
                style={{ color: active && hours > 0 ? '#2D2D2D' : '#CBD5E1' }}
              >
                {active && hours > 0 ? `${hours % 1 === 0 ? hours : hours.toFixed(1)}h` : '—'}
              </span>

              {/* Overnight badge */}
              {isOvernight && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#6366F1]">
                  +1 día
                </span>
              )}

              {/* Rest toggle — one click to activate/deactivate the day */}
              <button
                onClick={() => toggleRest(i)}
                title={active ? 'Marcar como descanso' : 'Activar día'}
                className="flex items-center gap-1 mt-0.5 transition-opacity"
                style={{ opacity: 0.8 }}
              >
                {/* Toggle pill */}
                <div
                  className="relative w-7 h-4 rounded-full transition-colors duration-200"
                  style={{ background: active ? '#1BBBEE' : '#CBD5E1' }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ left: active ? '13px' : '2px' }}
                  />
                </div>
                <span
                  className="text-[9px] font-semibold transition-colors"
                  style={{ color: active ? '#1BBBEE' : '#94A3B8' }}
                >
                  {active ? 'activo' : 'desc.'}
                </span>
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
