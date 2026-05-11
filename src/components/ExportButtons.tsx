import { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { AppState } from '../data/lft';
import type { CrewResult } from '../data/lft';

interface Props {
  state: AppState;
  results: CrewResult[];
}

export function ExportButtons({ state, results }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlLoading, setXlLoading] = useState(false);

  const disabled = state.crews.length === 0;

  const handlePDF = async () => {
    if (disabled || pdfLoading) return;
    setPdfLoading(true);
    try {
      await new Promise(r => setTimeout(r, 50)); // let spinner render
      const { generatePDF } = await import('../export/pdfReport');
      generatePDF(state, results);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcel = async () => {
    if (disabled || xlLoading) return;
    setXlLoading(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const { generateExcel } = await import('../export/excelReport');
      generateExcel(state, results);
    } finally {
      setXlLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mr-1">
        Exportar
      </span>

      {/* PDF button */}
      <button
        onClick={handlePDF}
        disabled={disabled || pdfLoading}
        title={disabled ? 'Agrega al menos una tripulación' : 'Descargar reporte PDF'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: '#231F20',
          color: '#1BBBEE',
          borderColor: '#1BBBEE',
        }}
        onMouseOver={e => { if (!disabled) (e.currentTarget.style.background = '#1BBBEE'); (e.currentTarget.style.color = '#231F20'); }}
        onMouseOut={e => { (e.currentTarget.style.background = '#231F20'); (e.currentTarget.style.color = '#1BBBEE'); }}
      >
        {pdfLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileText className="w-4 h-4" />}
        PDF
      </button>

      {/* Excel button */}
      <button
        onClick={handleExcel}
        disabled={disabled || xlLoading}
        title={disabled ? 'Agrega al menos una tripulación' : 'Descargar libro Excel'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: '#231F20',
          color: '#22c55e',
          borderColor: '#22c55e',
        }}
        onMouseOver={e => { if (!disabled) (e.currentTarget.style.background = '#22c55e'); (e.currentTarget.style.color = '#231F20'); }}
        onMouseOut={e => { (e.currentTarget.style.background = '#231F20'); (e.currentTarget.style.color = '#22c55e'); }}
      >
        {xlLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileSpreadsheet className="w-4 h-4" />}
        Excel
      </button>
    </div>
  );
}
