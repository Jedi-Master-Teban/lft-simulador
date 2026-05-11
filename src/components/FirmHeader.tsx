import { Scale } from 'lucide-react';
import type { FirmConfig, LFTYear } from '../data/lft';
import { LFT_YEARS } from '../data/lft';

interface Props {
  firm: FirmConfig;
  onUpdate: (firm: FirmConfig) => void;
}

export function FirmHeader({ firm, onUpdate }: Props) {
  const set = <K extends keyof FirmConfig>(key: K, value: FirmConfig[K]) =>
    onUpdate({ ...firm, [key]: value });

  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-500 rounded-lg p-2">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">
              Simulador de Jornada Laboral
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Ley Federal del Trabajo · Reforma 2026–2030
            </p>
          </div>
        </div>

        {/* Firm info + settings grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Razón Social */}
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Razón Social
            </label>
            <input
              type="text"
              value={firm.razonSocial}
              onChange={e => set('razonSocial', e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Planta */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Planta / Sitio
            </label>
            <input
              type="text"
              value={firm.planta}
              onChange={e => set('planta', e.target.value)}
              placeholder="Planta principal"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Año de Análisis
            </label>
            <select
              value={firm.year}
              onChange={e => set('year', Number(e.target.value) as LFTYear)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition cursor-pointer"
            >
              {LFT_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Salario */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Salario Diario Prom. (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={firm.salarioDiario}
                onChange={e => set('salarioDiario', Math.max(0, Number(e.target.value)))}
                min="0"
                step="50"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Analysis date */}
          <div className="col-span-2 sm:col-span-1 flex items-end">
            <p className="text-xs text-slate-500">
              Análisis al:{' '}
              <span className="text-slate-400">
                {new Date().toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
