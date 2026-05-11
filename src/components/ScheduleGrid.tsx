import { getDayHours } from '../data/lft';
import type { DaySchedule, WeekSchedule } from '../data/lft';
import { DAYS_SHORT } from '../data/lft';

interface Props {
  schedule: WeekSchedule;
  dailyHours: number[]; // pre-computed to avoid recalc
  onChange: (schedule: WeekSchedule) => void;
}

export function ScheduleGrid({ schedule, dailyHours, onChange }: Props) {
  const updateDay = (i: number, field: keyof DaySchedule, value: string) => {
    const next = [...schedule] as WeekSchedule;
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const clearDay = (i: number) => {
    const next = [...schedule] as WeekSchedule;
    next[i] = { start: '', end: '' };
    onChange(next);
  };

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-2 min-w-max">
        {DAYS_SHORT.map((label, i) => {
          const day = schedule[i];
          const hours = dailyHours[i] ?? getDayHours(day);
          const isRest = !day.start && !day.end;
          const isOvernight =
            day.start && day.end
              ? parseInt(day.end.replace(':', '')) <= parseInt(day.start.replace(':', ''))
              : false;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 w-[72px]">
              {/* Day name */}
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {label}
              </span>

              {/* Input card */}
              <div
                className={`w-full rounded-lg border transition-colors ${
                  isRest
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  type="time"
                  value={day.start}
                  onChange={e => updateDay(i, 'start', e.target.value)}
                  className={`w-full text-center text-xs px-1 py-1.5 rounded-t-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-transparent ${
                    isRest ? 'text-slate-400' : 'text-slate-700'
                  }`}
                  placeholder="--:--"
                />
                <div className="border-t border-slate-200" />
                <input
                  type="time"
                  value={day.end}
                  onChange={e => updateDay(i, 'end', e.target.value)}
                  className={`w-full text-center text-xs px-1 py-1.5 rounded-b-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-transparent ${
                    isRest ? 'text-slate-400' : 'text-slate-700'
                  }`}
                  placeholder="--:--"
                />
              </div>

              {/* Hours badge */}
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={`text-xs font-semibold ${
                    isRest
                      ? 'text-slate-300'
                      : hours > 0
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {isRest ? '—' : hours > 0 ? `${hours % 1 === 0 ? hours : hours.toFixed(1)}h` : '—'}
                </span>
                {isOvernight && !isRest && (
                  <span className="text-[9px] text-violet-500 font-medium">noche</span>
                )}
              </div>

              {/* Clear button */}
              {!isRest && (
                <button
                  onClick={() => clearDay(i)}
                  title="Marcar como día de descanso"
                  className="text-[11px] text-slate-300 hover:text-red-400 transition-colors leading-none"
                >
                  descanso
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
