// xlsx-js-style is a drop-in fork of SheetJS that adds full cell-style support
// in the browser with no extra polyfills needed.
import XLSX from 'xlsx-js-style';
import type { AppState, CrewResult } from '../data/lft';
import { DAYS_ES, REFERENCE, formatMXN, formatHours } from '../data/lft';

// ── Brand colours (ARGB hex strings, no #) ────────────────────────────────
const CYAN      = '1BBBEE'; // #1BBBEE sky cyan
const BLUE      = '2870B5'; // #2870B5 steel blue
const WHITE     = 'FFFFFF';
const CHARCOAL  = '2D2D2D';
const LIGHT_BG  = 'E0F5FD'; // very pale cyan for alternating rows
const GREEN_BG  = 'D1FAE5';
const GREEN_FG  = '065F46';
const RED_BG    = 'FEE2E2';
const RED_FG    = '991B1B';

// ── Style factories ────────────────────────────────────────────────────────

type CellStyle = {
  fill?: { patternType: 'solid'; fgColor: { rgb: string } };
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number; name?: string };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
};

const solidFill = (rgb: string) => ({ patternType: 'solid' as const, fgColor: { rgb } });
const thinBorder = (rgb: string) => ({
  top:    { style: 'thin', color: { rgb } },
  bottom: { style: 'thin', color: { rgb } },
  left:   { style: 'thin', color: { rgb } },
  right:  { style: 'thin', color: { rgb } },
});

// Header row: cyan bg, white bold text, centred
const S_CYAN_HEADER: CellStyle = {
  fill: solidFill(CYAN),
  font: { bold: true, color: { rgb: WHITE }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder('AADDEE'),
};

// Sub-header row: steel blue bg, white bold text
const S_BLUE_HEADER: CellStyle = {
  fill: solidFill(BLUE),
  font: { bold: true, color: { rgb: WHITE }, sz: 9, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder('4488BB'),
};

// Section label: charcoal bg, white bold (slightly darker feel)
const S_SECTION: CellStyle = {
  fill: solidFill('3D3D3D'),
  font: { bold: true, color: { rgb: CYAN }, sz: 9, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
};

// Normal data cell
const S_DATA: CellStyle = {
  fill: solidFill(WHITE),
  font: { color: { rgb: CHARCOAL }, sz: 9, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder('E2E8F0'),
};

// Alternating row tint
const S_DATA_ALT: CellStyle = {
  ...S_DATA,
  fill: solidFill(LIGHT_BG),
};

// Left-aligned data cell
const S_DATA_LEFT: CellStyle = { ...S_DATA, alignment: { horizontal: 'left', vertical: 'center' } };
const S_DATA_LEFT_ALT: CellStyle = { ...S_DATA_ALT, alignment: { horizontal: 'left', vertical: 'center' } };

// Bold data cell
const S_DATA_BOLD: CellStyle = { ...S_DATA, font: { ...S_DATA.font, bold: true } };

// Cover title
const S_TITLE: CellStyle = {
  fill: solidFill(CYAN),
  font: { bold: true, color: { rgb: WHITE }, sz: 20, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

const S_SUBTITLE: CellStyle = {
  fill: solidFill(CYAN),
  font: { bold: false, color: { rgb: WHITE }, sz: 12, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

const S_COVER_BG: CellStyle = {
  fill: solidFill(CYAN),
  font: { color: { rgb: WHITE }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
};

const S_COVER_LABEL: CellStyle = {
  fill: solidFill(BLUE),
  font: { bold: true, color: { rgb: WHITE }, sz: 9, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const S_COVER_VALUE: CellStyle = {
  fill: solidFill(WHITE),
  font: { bold: false, color: { rgb: CHARCOAL }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const S_STATUS_OK: CellStyle = {
  fill: solidFill(GREEN_BG),
  font: { bold: true, color: { rgb: GREEN_FG }, sz: 11, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder('A7F3D0'),
};

const S_STATUS_ERR: CellStyle = {
  fill: solidFill(RED_BG),
  font: { bold: true, color: { rgb: RED_FG }, sz: 11, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder('FECACA'),
};

const S_TOTAL: CellStyle = {
  fill: solidFill(BLUE),
  font: { bold: true, color: { rgb: WHITE }, sz: 9, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder('4488BB'),
};

const S_DISCLAIMER: CellStyle = {
  fill: solidFill('3D3D3D'),
  font: { color: { rgb: 'AAAAAA' }, sz: 7, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

// ── Helpers ────────────────────────────────────────────────────────────────

type Row = (string | number)[];

/** Apply a single style to every cell in an AOA row, starting at (rowIdx, 0) */
function styleRow(ws: XLSX.WorkSheet, rowIdx: number, ncols: number, style: CellStyle) {
  for (let c = 0; c < ncols; c++) {
    const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
    if (!ws[ref]) ws[ref] = { v: '', t: 's' };
    ws[ref].s = style;
  }
}

/** Style alternating data rows (skip header row at rowIdx 0 of data range) */
function styleDataRows(
  ws: XLSX.WorkSheet,
  firstDataRow: number,
  lastDataRow: number,
  ncols: number,
  leftAligned = false,
) {
  const base    = leftAligned ? S_DATA_LEFT     : S_DATA;
  const alt     = leftAligned ? S_DATA_LEFT_ALT : S_DATA_ALT;
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const s = (r - firstDataRow) % 2 === 0 ? base : alt;
    styleRow(ws, r, ncols, s);
  }
}

/** Add a merge to the ws !merges array */
function merge(ws: XLSX.WorkSheet, r1: number, c1: number, r2: number, c2: number) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

// ── Main export ────────────────────────────────────────────────────────────

export function generateExcel(state: AppState, results: CrewResult[]) {
  const { firm, crews } = state;
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const allOk = results.every(r => r.isCompliant);
  const totalOT = results.reduce((s, r) => s + r.totalOTCost, 0);
  const totalExtra = results.reduce((s, r) => s + r.overtimeHours, 0);

  // ── SHEET 1: Portada ────────────────────────────────────────────────────

  // Cover sheet spans A–L (12 columns, indices 0–11)
  const NCOLS_COVER = 12;
  const E = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });
  const PAD = ['', '', '', '', '', '', '', '', ''] as const; // 9 trailing empty cells for 12-col rows

  const cover: Row[] = [
    [''],                                                          // r0 spacer
    ['SIMULADOR DE REDUCCIÓN DE JORNADA LABORAL'],                // r1 big title (merged A–L)
    [''],                                                          // r2
    ['Taller 40 Horas — Catch Consulting, S.C.'],                 // r3 subtitle (merged A–L)
    [''],                                                          // r4
    ['', 'Empresa',            firm.razonSocial || '(no especificado)', ...PAD],  // r5
    ['', 'Planta',             firm.planta      || '(no especificado)', ...PAD],  // r6
    ['', 'Año',                firm.year,                         ...PAD],        // r7
    ['', 'Fecha',              today,                             ...PAD],        // r8
    ['', 'Salario diario prom.', formatMXN(firm.salarioDiario),  ...PAD],        // r9
    [''],                                                          // r10
    ['', 'Total horas extra',  formatHours(totalExtra),           ...PAD],        // r11
    ['', 'Costo TE semanal',   formatMXN(totalOT),                ...PAD],        // r12
    [''],                                                          // r13
    ['ESTATUS'],                                                   // r14 (merged A–L)
    [allOk ? 'EN CUMPLIMIENTO CON LA LFT' : 'INCUMPLIMIENTO DETECTADO'], // r15 (merged A–L)
    [''],                                                          // r16
    [''],                                                          // r17
    ['Agradecemos que hayas utilizado el Simulador de Jornada Laboral de Catch Consulting.'], // r18
    ['Los resultados contienen tu estatus de compliance con la Ley Federal del Trabajo,'],   // r19
    ['la estimación de horas extra y el valor de dichas horas para el año de tu simulación.'], // r20
    [''],                                                          // r21
    ['Te esperamos en una nueva oportunidad de capacitación para estar al tanto de los'],    // r22
    ['nuevos cambios en la regulación laboral. ¡Siempre puedes contar con nosotros!'],      // r23
    [''],                                                          // r24
    ['® Prohibido el uso o distribución sin autorización expresa de Catch Consulting, S.C. | www.catchconsulting.com.mx'],
  ];

  const wsCover = XLSX.utils.aoa_to_sheet(cover);

  // Columns A–L: narrow spacer | label | value (wide, spanning C–K) | narrow spacer
  wsCover['!cols'] = [
    { wch: 2  }, // A — left spacer
    { wch: 22 }, // B — label
    { wch: 14 }, // C — value start
    { wch: 14 }, // D
    { wch: 14 }, // E
    { wch: 14 }, // F
    { wch: 14 }, // G
    { wch: 14 }, // H
    { wch: 14 }, // I
    { wch: 14 }, // J
    { wch: 14 }, // K
    { wch: 2  }, // L — right spacer
  ];
  wsCover['!rows'] = [
    { hpt: 8 }, { hpt: 46 }, { hpt: 8 }, { hpt: 24 }, { hpt: 8 },
    { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
    { hpt: 8 },  { hpt: 20 }, { hpt: 20 },
    { hpt: 8 },  { hpt: 16 }, { hpt: 26 },
    { hpt: 8 },  { hpt: 8 },
    { hpt: 16 }, { hpt: 16 }, { hpt: 16 },
    { hpt: 8 },  { hpt: 16 }, { hpt: 16 },
    { hpt: 8 },  { hpt: 14 },
  ];

  // Full-page cyan background across all 12 columns
  for (let r = 0; r < cover.length; r++) styleRow(wsCover, r, NCOLS_COVER, S_COVER_BG);

  // Title row — merged A–L
  merge(wsCover, 1, 0, 1, 11);
  wsCover[E(1, 0)].s = S_TITLE;

  // Subtitle row — merged A–L
  merge(wsCover, 3, 0, 3, 11);
  wsCover[E(3, 0)].s = S_SUBTITLE;

  // Info rows: label (col B=1) + value merged across cols C–K (c2–c10)
  for (const r of [5, 6, 7, 8, 9, 11, 12]) {
    wsCover[E(r, 1)].s = S_COVER_LABEL;
    merge(wsCover, r, 2, r, 10);   // value spans C–K
    wsCover[E(r, 2)].s = S_COVER_VALUE;
  }

  // Status rows — merged A–L
  merge(wsCover, 14, 0, 14, 11);
  wsCover[E(14, 0)].s = S_BLUE_HEADER;

  merge(wsCover, 15, 0, 15, 11);
  wsCover[E(15, 0)].s = allOk ? S_STATUS_OK : S_STATUS_ERR;

  // Text rows — merged A–L
  for (const r of [18, 19, 20, 22, 23]) {
    merge(wsCover, r, 0, r, 11);
  }

  // Disclaimer — merged A–L
  merge(wsCover, 25, 0, 25, 11);
  wsCover[E(25, 0)].s = S_DISCLAIMER;

  XLSX.utils.book_append_sheet(wb, wsCover, 'Portada');

  // ── SHEET 2: Resumen ─────────────────────────────────────────────────────

  const NCOLS_SUM = 9;
  const sumRows: Row[] = [
    ['SIMULADOR DE JORNADA LABORAL — CATCH CONSULTING, S.C.'],  // r0
    [`Empresa: ${firm.razonSocial || '—'}  |  Año: ${firm.year}  |  Fecha: ${today}`], // r1
    [],                                                           // r2 spacer
    ['LA TABLA DE REFERENCIA'],                                   // r3
    ['Año', 'Diurna (h)', 'Mixta (h)', 'Nocturna (h)', 'Máx. Dobles', 'Máx. Triples', 'Total Máx. Diurna', '', ''],
    ...[2026, 2027, 2028, 2029, 2030].map(yr => {
      const ref = REFERENCE[yr as keyof typeof REFERENCE];
      return [yr, ref.Diurna, ref.Mixta, ref.Nocturna, ref.maxDouble, ref.maxTriple,
        ref.Diurna + ref.maxDouble + ref.maxTriple, '', ''] as Row;
    }),
    [],                                                           // r10 spacer
    ['LA MATRIZ DE TU HEADCOUNT'],                               // r11
    ['Tripulación', 'Tipo Jornada', 'Trabajadores', 'Total h/sem', 'Extras (h)', 'Dobles (h)', 'Triples (h)', 'Costo TE', 'Estatus'],
    ...results.map((r, i) => [
      crews[i].nombre,
      r.effectiveShiftType,
      crews[i].workers,
      r.totalWeeklyHours,
      r.overtimeHours,
      r.doubleHours,
      r.tripleHours,
      r.totalOTCost,
      r.isCompliant ? 'CUMPLE' : 'INCUMPLIMIENTO',
    ] as Row),
    ['TOTALES', '', crews.reduce((s, c) => s + c.workers, 0),
      results.reduce((s, r) => s + r.totalWeeklyHours, 0),
      results.reduce((s, r) => s + r.overtimeHours, 0),
      results.reduce((s, r) => s + r.doubleHours, 0),
      results.reduce((s, r) => s + r.tripleHours, 0),
      totalOT, ''],
    [],
    [`® Catch Consulting, S.C. | www.catchconsulting.com.mx | Rev. ${today}`],
  ];

  const wsSum = XLSX.utils.aoa_to_sheet(sumRows);
  wsSum['!cols'] = [
    { wch: 24 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
    { wch: 13 }, { wch: 13 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
  ];

  // Big title + subtitle
  merge(wsSum, 0, 0, 0, NCOLS_SUM - 1);
  wsSum[XLSX.utils.encode_cell({ r: 0, c: 0 })].s = S_CYAN_HEADER;

  merge(wsSum, 1, 0, 1, NCOLS_SUM - 1);
  wsSum[XLSX.utils.encode_cell({ r: 1, c: 0 })].s = {
    ...S_COVER_BG, fill: solidFill('3D3D3D'),
    font: { color: { rgb: 'AAAAAA' }, sz: 8, name: 'Calibri' },
  };

  // Section label "TABLA DE REFERENCIA"
  merge(wsSum, 3, 0, 3, NCOLS_SUM - 1);
  wsSum[XLSX.utils.encode_cell({ r: 3, c: 0 })].s = S_SECTION;

  // Ref table header (r4) + data (r5–r9)
  styleRow(wsSum, 4, 7, S_BLUE_HEADER);
  styleDataRows(wsSum, 5, 9, 7);
  // Highlight active year
  const activeYearRow = 5 + [2026, 2027, 2028, 2029, 2030].indexOf(firm.year);
  styleRow(wsSum, activeYearRow, 7, S_CYAN_HEADER);

  // Section label "HEADCOUNT MATRIX"
  merge(wsSum, 11, 0, 11, NCOLS_SUM - 1);
  wsSum[XLSX.utils.encode_cell({ r: 11, c: 0 })].s = S_SECTION;

  // Headcount table header (r12) + data rows + totals
  styleRow(wsSum, 12, NCOLS_SUM, S_BLUE_HEADER);
  const hcFirst = 13, hcLast = 13 + results.length - 1;
  styleDataRows(wsSum, hcFirst, hcLast, NCOLS_SUM);

  // Style status column (last col) in headcount
  for (let r = hcFirst; r <= hcLast; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: NCOLS_SUM - 1 });
    const val = results[r - hcFirst].isCompliant;
    wsSum[ref].s = val ? S_STATUS_OK : S_STATUS_ERR;
  }

  // Totals row
  styleRow(wsSum, hcLast + 1, NCOLS_SUM, S_TOTAL);

  // Disclaimer
  merge(wsSum, hcLast + 3, 0, hcLast + 3, NCOLS_SUM - 1);
  if (wsSum[XLSX.utils.encode_cell({ r: hcLast + 3, c: 0 })]) {
    wsSum[XLSX.utils.encode_cell({ r: hcLast + 3, c: 0 })].s = S_DISCLAIMER;
  }

  XLSX.utils.book_append_sheet(wb, wsSum, 'Resumen');

  // ── PER-CREW SHEETS ──────────────────────────────────────────────────────

  for (let i = 0; i < crews.length; i++) {
    const crew = crews[i];
    const r = results[i];
    const ref = REFERENCE[firm.year];

    const NCOLS = 8;

    const crewRows: Row[] = [
      // r0: crew name header
      [`${crew.nombre.toUpperCase()}  |  ${r.effectiveShiftType}  |  ${crew.workers} trabajadores  |  Año ${firm.year}`],
      [],  // r1 spacer

      // r2: schedule section label
      ['HORARIO SEMANAL'],
      // r3: day headers
      ['', ...DAYS_ES] as Row,
      // r4–r6: schedule data
      ['Entrada', ...crew.schedule.map(d => d.start || '—')] as Row,
      ['Salida',  ...crew.schedule.map(d => d.end   || '—')] as Row,
      ['Horas',   ...r.dailyHours.map(h => h > 0 ? `${h % 1 === 0 ? h : h.toFixed(1)}h` : '—')] as Row,
      [],  // r7 spacer

      // r8: breakdown section label
      ['DESGLOSE DE JORNADA'],
      // r9: breakdown header
      ['Concepto', 'Horas', 'Límite Legal', 'Referencia LFT', '', '', '', ''],
      // r10–r14: breakdown data
      ['Jornada legal máxima', `${r.legalMaxHours}h`, `${r.legalMaxHours}h`, 'Arts. 60-61 LFT', '', '', '', ''],
      ['Total horas semanales', formatHours(r.totalWeeklyHours), `${r.legalMaxHours}h`, '—', '', '', '', ''],
      ['Tiempo extraordinario', formatHours(r.overtimeHours), '—', 'Art. 65 LFT', '', '', '', ''],
      [`Horas dobles (2×)`, formatHours(r.doubleHours), `Máx. ${ref.maxDouble}h`, 'Art. 67 LFT', '', '', '', ''],
      [`Horas triples (3×)`, formatHours(r.tripleHours), 'Máx. 4h', 'Art. 68 LFT', '', '', '', ''],
      [],  // r15 spacer

      // r16: cost section label
      ['COSTO DE TIEMPO EXTRA SEMANAL'],
      // r17: cost header
      ['Concepto', 'Horas', 'Factor', 'Trabajadores', 'Tarifa/hora', 'Subtotal', '', ''],
      // r18–r20: cost data + total
      ['Horas dobles (2×)', formatHours(r.doubleHours), '×2', crew.workers, formatMXN(firm.salarioDiario / 8), formatMXN(r.doubleCost), '', ''],
      ['Horas triples (3×)', formatHours(r.tripleHours), '×3', crew.workers, formatMXN(firm.salarioDiario / 8), formatMXN(r.tripleCost), '', ''],
      ['TOTAL COSTO TE', '', '', '', '', formatMXN(r.totalOTCost), '', ''],
      [],  // r21 spacer

      // r22: compliance section label
      ['RESULTADO DE CUMPLIMIENTO'],
      // r23: compliance value
      [r.isCompliant ? 'CUMPLE CON LA JORNADA LEGAL' : 'INCUMPLIMIENTO DETECTADO'],
      // r24+: violations if any
      ...(r.violations.length > 0
        ? [
            ['Artículo', 'Descripción', '', '', '', '', '', ''] as Row,
            ...r.violations.map(v => [v.article, v.description, '', '', '', '', '', ''] as Row),
          ]
        : [[`Sin violaciones para el año ${firm.year}`, '', '', '', '', '', '', ''] as Row]
      ),
      [],
      [`® Catch Consulting, S.C.  |  www.catchconsulting.com.mx  |  Rev. ${today}`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(crewRows);
    ws['!cols'] = [
      { wch: 26 }, { wch: 11 }, { wch: 11 }, { wch: 11 },
      { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 8 },
    ];

    // r0: big cyan title, merged
    merge(ws, 0, 0, 0, NCOLS - 1);
    ws[XLSX.utils.encode_cell({ r: 0, c: 0 })].s = S_CYAN_HEADER;
    ws['!rows'] = [{ hpt: 24 }];

    // r2: schedule section label
    merge(ws, 2, 0, 2, NCOLS - 1);
    ws[XLSX.utils.encode_cell({ r: 2, c: 0 })].s = S_SECTION;

    // r3: day headers (8 cols: label + 7 days)
    styleRow(ws, 3, 8, S_BLUE_HEADER);
    // r4–r6: schedule data
    for (let row = 4; row <= 6; row++) {
      styleRow(ws, row, 8, row % 2 === 0 ? S_DATA : S_DATA_ALT);
      ws[XLSX.utils.encode_cell({ r: row, c: 0 })].s = S_DATA_BOLD;
    }

    // r8: breakdown section label
    merge(ws, 8, 0, 8, NCOLS - 1);
    ws[XLSX.utils.encode_cell({ r: 8, c: 0 })].s = S_SECTION;

    // r9: breakdown header
    styleRow(ws, 9, 4, S_BLUE_HEADER);
    // r10–r14: breakdown data
    styleDataRows(ws, 10, 14, 4, true);

    // r16: cost section label
    merge(ws, 16, 0, 16, NCOLS - 1);
    ws[XLSX.utils.encode_cell({ r: 16, c: 0 })].s = S_SECTION;

    // r17: cost header
    styleRow(ws, 17, 6, S_BLUE_HEADER);
    // r18–r19: cost data rows
    styleDataRows(ws, 18, 19, 6);
    // r20: totals
    styleRow(ws, 20, 6, S_TOTAL);

    // r22: compliance section label
    merge(ws, 22, 0, 22, NCOLS - 1);
    ws[XLSX.utils.encode_cell({ r: 22, c: 0 })].s = S_SECTION;

    // r23: compliance value
    merge(ws, 23, 0, 23, NCOLS - 1);
    ws[XLSX.utils.encode_cell({ r: 23, c: 0 })].s = r.isCompliant ? S_STATUS_OK : S_STATUS_ERR;

    // Violations table (if any)
    if (r.violations.length > 0) {
      styleRow(ws, 24, 2, S_BLUE_HEADER);
      for (let vr = 0; vr < r.violations.length; vr++) {
        styleRow(ws, 25 + vr, 2, vr % 2 === 0 ? S_DATA : S_DATA_ALT);
        ws[XLSX.utils.encode_cell({ r: 25 + vr, c: 0 })].s = { ...S_DATA_BOLD, font: { bold: true, color: { rgb: RED_FG }, sz: 9 } };
      }
    }

    // Safe sheet name (max 31 chars)
    const sheetName = crew.nombre.slice(0, 31).replace(/[\\/:*?[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // ── Download ─────────────────────────────────────────────────────────────

  const safe = (firm.razonSocial || 'empresa').replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Catch_Simulador_LFT_${firm.year}_${safe}.xlsx`);
}

export { formatHours, formatMXN };
