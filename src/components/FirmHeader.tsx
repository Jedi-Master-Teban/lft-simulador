import catchLogo from '../../LOGO.png';
import type { FirmConfig, LFTYear, MealBreak } from '../data/lft';
import { LFT_YEARS, MEAL_BREAK_DEFAULT } from '../data/lft';

interface Props {
  firm: FirmConfig;
  onUpdate: (firm: FirmConfig) => void;
}

const inputCls =
  'w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#2D2D2D] ' +
  'placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1BBBEE]/30 ' +
  'focus:border-[#1BBBEE] transition-all';

export function FirmHeader({ firm, onUpdate }: Props) {
  const set = <K extends keyof FirmConfig>(key: K, val: FirmConfig[K]) =>
    onUpdate({ ...firm, [key]: val });

  return (
    <header className="bg-white border-b border-[#E2E8F0]" style={{ borderTop: '4px solid #1BBBEE' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Brand row ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            {/* Optional custom app icon from /public/app-icon.png */}
            <AppIcon />

            {/* Catch Consulting logo — full color, no filter */}
            <img src={catchLogo} alt="Catch Consulting" className="h-9 object-contain" />

            <div className="hidden sm:block w-px h-8 bg-[#E2E8F0]" />

            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold text-[#2D2D2D] leading-none tracking-tight">
                Simulador de Jornada Laboral
              </h1>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#1BBBEE' }}>
                Ley Federal del Trabajo · Reforma 2026–2030
              </p>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8] hidden sm:block shrink-0">
            Análisis al{' '}
            <span className="text-[#555555] font-medium">
              {new Date().toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </span>
          </p>
        </div>

        {/* ── Settings strip ──────────────────────────────────────────── */}
        <div className="border-t border-[#E2E8F0] py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={firm.razonSocial}
                onChange={e => set('razonSocial', e.target.value)}
                placeholder="Nombre de la empresa"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                Planta / Sitio
              </label>
              <input
                type="text"
                value={firm.planta}
                onChange={e => set('planta', e.target.value)}
                placeholder="Planta principal"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                Año de Análisis
              </label>
              <select
                value={firm.year}
                onChange={e => set('year', Number(e.target.value) as LFTYear)}
                className={`${inputCls} cursor-pointer`}
              >
                {LFT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                Salario Diario Prom.
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-medium">$</span>
                <input
                  type="number"
                  value={firm.salarioDiario}
                  onChange={e => set('salarioDiario', Math.max(0, Number(e.target.value)))}
                  min="0" step="50"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Meal break strip ────────────────────────────────────────── */}
        <div className="border-t border-[#E2E8F0] py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] shrink-0">
            Descanso para Comida
          </span>
          <div className="flex items-center gap-1.5">
            {([
              { value: 0,   label: 'Ninguno' },
              { value: 0.5, label: '30 min'  },
              { value: 1,   label: '1 hora'  },
            ] as { value: MealBreak; label: string }[]).map(({ value, label }) => {
              const active = (firm.mealBreak ?? MEAL_BREAK_DEFAULT) === value;
              return (
                <button
                  key={value}
                  onClick={() => set('mealBreak', value)}
                  className="px-3 py-1 text-xs font-semibold rounded-full border transition-all"
                  style={
                    active
                      ? { background: '#1BBBEE', color: '#fff', borderColor: '#1BBBEE' }
                      : { background: '#fff', color: '#64748B', borderColor: '#E2E8F0' }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-[#94A3B8]">
            {(firm.mealBreak ?? MEAL_BREAK_DEFAULT) === 0
              ? 'Las horas se contabilizan sin descuento de comida.'
              : `Se descuenta ${(firm.mealBreak ?? MEAL_BREAK_DEFAULT) === 0.5 ? '30 min' : '1 hora'} por jornada activa (Art. 63 LFT).`}
          </span>
        </div>

      </div>
    </header>
  );
}

function AppIcon() {
  return (
    <img
      src="/app-icon.png"
      alt=""
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      className="h-9 w-9 object-contain rounded-lg"
    />
  );
}
