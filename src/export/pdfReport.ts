import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AppState, CrewResult } from '../data/lft';
import { DAYS_ES, REFERENCE, formatMXN, formatHours } from '../data/lft';

// ── Brand colours ──────────────────────────────────────────────────────────
const CYAN    = [27, 187, 238]  as [number, number, number]; // #1BBBEE
const BLUE    = [40, 112, 181]  as [number, number, number]; // #2870B5
const WHITE   = [255, 255, 255] as [number, number, number];
const CHARCOAL= [45, 45, 45]    as [number, number, number]; // #2D2D2D
const CYAN_LT = [200, 237, 252] as [number, number, number]; // lighter cyan for accents

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const M = 16;       // left/right margin

// ── Helpers ────────────────────────────────────────────────────────────────

function fill(doc: jsPDF, color: [number, number, number]) { doc.setFillColor(...color); }
function text(doc: jsPDF, color: [number, number, number]) { doc.setTextColor(...color); }
function draw(doc: jsPDF, color: [number, number, number]) { doc.setDrawColor(...color); }

/** Draw the full-page cyan background */
function cyanPage(doc: jsPDF) {
  fill(doc, CYAN);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

/** Decorative large "C" watermark — top-right corner */
function watermarkC(doc: jsPDF) {
  doc.setFontSize(180);
  doc.setFont('helvetica', 'bold');
  text(doc, [255, 255, 255]);
  doc.setGState(new (doc as never as { GState: new (o: object) => unknown }).GState({ opacity: 0.12 }));
  doc.text('C', PAGE_W - 8, 68, { align: 'right' });
  doc.setGState(new (doc as never as { GState: new (o: object) => unknown }).GState({ opacity: 1 }));
}

/** Diagonal accent stripe (right edge) */
function accentStripe(doc: jsPDF) {
  fill(doc, CYAN_LT);
  doc.setGState(new (doc as never as { GState: new (o: object) => unknown }).GState({ opacity: 0.18 }));
  // Draw a simple right-edge stripe via polygon
  const x = PAGE_W - 28;
  doc.triangle(x, 0, PAGE_W, 0, PAGE_W, 90, 'F');
  doc.setGState(new (doc as never as { GState: new (o: object) => unknown }).GState({ opacity: 1 }));
}

/** Catch logo text (we can't embed image in PDF without base64, so we use text) */
function catchBrand(doc: jsPDF, y: number) {
  // "Catch Consulting" styled text in footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  text(doc, WHITE);
  doc.text('Catch', M, y);
  doc.setFont('helvetica', 'normal');
  doc.text(' Consulting', M + 12, y);
  doc.setFontSize(7);
  doc.text('www.catchconsulting.com.mx', M, y + 4.5);
}

/** Per-page footer */
function pageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - 14;
  // Thin white rule
  draw(doc, WHITE);
  doc.setLineWidth(0.3);
  doc.line(M, y - 3, PAGE_W - M, y - 3);
  catchBrand(doc, y);
  doc.setFontSize(7);
  text(doc, WHITE);
  doc.text(
    `Pag. ${pageNum} / ${totalPages}  |  COPYRIGHT: uso prohibido sin autorizacion expresa de Catch Consulting, S.C.`,
    PAGE_W - M, y,
    { align: 'right' },
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function generatePDF(state: AppState, results: CrewResult[]) {
  const { firm, crews } = state;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let totalPages = 1 + crews.length + 1; // cover + per-crew + disclaimer

  // ── PAGE 1: Cover ──────────────────────────────────────────────────────

  cyanPage(doc);
  accentStripe(doc);
  watermarkC(doc);

  // Big title
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  text(doc, WHITE);
  doc.text('Taller Reduccion de Jornada', PAGE_W / 2, 72, { align: 'center' });

  doc.setFontSize(40);
  doc.text('40 horas', PAGE_W / 2, 90, { align: 'center' });

  // Body text
  const empresa = firm.razonSocial || '(empresa no especificada)';
  const bodyLines = [
    'Agradecemos que hayas utilizado el Simulador de Jornada Laboral',
    'de Catch Consulting. Los resultados a continuacion contienen',
    'informacion de tu estatus de compliance con la Ley Federal del',
    'Trabajo, la estimacion de horas extra y el valor por dichas horas,',
    `ajustadas para el anno de tu simulacion. Tus resultados, ${empresa}:`,
    '',
    `Para el anno: ${firm.year}.`,
    `Tu total de horas extra: ${formatHours(results.reduce((s, r) => s + r.overtimeHours, 0))}.`,
    `Costo semanal de dichas horas: ${formatMXN(results.reduce((s, r) => s + r.totalOTCost, 0))}.`,
    '',
    `Estatus LFT: "${results.every(r => r.isCompliant) ? 'EN CUMPLIMIENTO' : 'INCUMPLIMIENTO DETECTADO'}".`,
    '',
    'Te esperamos en una nueva oportunidad de capacitacion para estar',
    'al tanto de los nuevos cambios en la regulacion laboral.',
    '|siempre puedes contar con nosotros!',
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 108;
  for (const line of bodyLines) {
    if (line === '') { y += 4; continue; }
    doc.text(line, M, y);
    y += 6;
  }

  pageFooter(doc, 1, totalPages);

  // ── PAGE 2: Detailed results ───────────────────────────────────────────

  doc.addPage();
  cyanPage(doc);
  accentStripe(doc);
  watermarkC(doc);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  text(doc, WHITE);
  doc.text('Tus resultados en detalle', M, 30);

  // Reference table
  y = 38;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  text(doc, WHITE);
  doc.text('La Tabla de Referencia', M, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Anno', 'Diurna', 'Mixta', 'Nocturna', 'Tope Dobles', 'Tope Triples']],
    body: ([2026, 2027, 2028, 2029, 2030] as const).map(yr => {
      const r = REFERENCE[yr];
      return [yr, `${r.Diurna}h`, `${r.Mixta}h`, `${r.Nocturna}h`, `${r.maxDouble}h`, `${r.maxTriple}h`];
    }),
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fillColor: WHITE, textColor: CHARCOAL, fontSize: 9 },
    alternateRowStyles: { fillColor: [235, 248, 255] as [number, number, number] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Headcount matrix
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  text(doc, WHITE);
  doc.text('La Matriz de tu Headcount', M, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Tripulacion', 'Jornada Legal (h/sem)', 'Extras (h)', 'Dobles (h)', 'Triples (h)', 'Costo TE', 'Estatus']],
    body: results.map((r, i) => [
      crews[i].nombre,
      `${r.legalMaxHours}h`,
      formatHours(r.overtimeHours),
      formatHours(r.doubleHours),
      formatHours(r.tripleHours),
      formatMXN(r.totalOTCost),
      r.isCompliant ? 'CUMPLE' : 'INCUMPLIMIENTO',
    ]),
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fillColor: WHITE, textColor: CHARCOAL, fontSize: 9 },
    alternateRowStyles: { fillColor: [235, 248, 255] as [number, number, number] },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 6) {
        const v = data.cell.raw as string;
        data.cell.styles.textColor = v === 'CUMPLE' ? [5, 95, 70] : [153, 27, 27];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  pageFooter(doc, 2, totalPages);

  // ── Per-crew detail pages ──────────────────────────────────────────────

  for (let i = 0; i < crews.length; i++) {
    doc.addPage();
    cyanPage(doc);
    accentStripe(doc);
    watermarkC(doc);

    const crew = crews[i];
    const r = results[i];

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    text(doc, WHITE);
    doc.text(`${crew.nombre}`, M, 26);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Jornada ${r.effectiveShiftType}  |  ${crew.workers} trabajadores  |  Anno ${firm.year}`, M, 33);

    // Schedule
    y = 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Horario Semanal', M, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['', ...DAYS_ES]],
      body: [
        ['Entrada', ...crew.schedule.map(d => d.start || '-')],
        ['Salida',  ...crew.schedule.map(d => d.end   || '-')],
        ['Horas',  ...r.dailyHours.map(h => h > 0 ? `${h % 1 === 0 ? h : h.toFixed(1)}h` : '-')],
      ],
      headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fillColor: WHITE, textColor: CHARCOAL, fontSize: 8 },
      alternateRowStyles: { fillColor: [235, 248, 255] as [number, number, number] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 14 } },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

    // Breakdown
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text(doc, WHITE);
    doc.text('Desglose de Jornada', M, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Concepto', 'Horas', 'Limite', 'Referencia']],
      body: [
        ['Jornada legal maxima', `${r.legalMaxHours}h`, `${r.legalMaxHours}h`, 'Arts. 60-61 LFT'],
        ['Total horas semanales', formatHours(r.totalWeeklyHours), `${r.legalMaxHours}h`, '-'],
        ['Tiempo extraordinario', formatHours(r.overtimeHours), '-', 'Art. 65 LFT'],
        ['Horas dobles (2x)', formatHours(r.doubleHours), `Max. ${REFERENCE[firm.year].maxDouble}h`, 'Art. 67 LFT'],
        ['Horas triples (3x)', formatHours(r.tripleHours), 'Max. 4h', 'Art. 68 LFT'],
      ],
      headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fillColor: WHITE, textColor: CHARCOAL, fontSize: 8.5 },
      alternateRowStyles: { fillColor: [235, 248, 255] as [number, number, number] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

    // Cost breakdown
    if (firm.salarioDiario > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      text(doc, WHITE);
      doc.text('Costo de Tiempo Extra Semanal', M, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Concepto', 'Horas', 'Factor', 'Trabajadores', 'Tarifa/h', 'Subtotal']],
        body: [
          ['Horas dobles (2x)', formatHours(r.doubleHours), 'x2', crew.workers, formatMXN(firm.salarioDiario / 8), formatMXN(r.doubleCost)],
          ['Horas triples (3x)', formatHours(r.tripleHours), 'x3', crew.workers, formatMXN(firm.salarioDiario / 8), formatMXN(r.tripleCost)],
          ['TOTAL', '', '', '', '', formatMXN(r.totalOTCost)],
        ],
        headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fillColor: WHITE, textColor: CHARCOAL, fontSize: 8.5 },
        alternateRowStyles: { fillColor: [235, 248, 255] as [number, number, number] },
        didParseCell(data) {
          if (data.section === 'body' && data.row.index === 2) {
            data.cell.styles.fillColor = BLUE;
            data.cell.styles.textColor = WHITE;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // Compliance status
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text(doc, WHITE);
    doc.text('Resultado de Cumplimiento', M, y);
    y += 4;

    if (r.isCompliant) {
      fill(doc, [200, 247, 224] as [number, number, number]);
      doc.roundedRect(M, y, PAGE_W - M * 2, 9, 2, 2, 'F');
      doc.setFontSize(9);
      text(doc, [5, 95, 70] as [number, number, number]);
      doc.text('[OK] Cumple con la jornada legal para el anno ' + firm.year, M + 4, y + 6);
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Articulo', 'Descripcion de la violacion']],
        body: r.violations.map(v => [v.article, v.description]),
        headStyles: { fillColor: [180, 30, 30] as [number, number, number], textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fillColor: WHITE, textColor: [100, 20, 20] as [number, number, number], fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38 } },
      });
    }

    pageFooter(doc, 3 + i, totalPages);
  }

  // ── Last page: Legal disclaimer ────────────────────────────────────────

  doc.addPage();
  cyanPage(doc);
  accentStripe(doc);
  watermarkC(doc);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  text(doc, WHITE);
  doc.text('Aviso Legal y Propiedad Intelectual', M, 28);

  draw(doc, WHITE);
  doc.setLineWidth(0.4);
  doc.line(M, 32, PAGE_W - M, 32);

  const disclaimerLines = [
    'Prohibido el uso o distribucion sin autorizacion expresa',
    'de Catch Consulting, S.C.',
    '',
    'Este simulador es una herramienta informativa basada en la',
    'Ley Federal del Trabajo (LFT). Los resultados no constituyen',
    'asesoria juridica. Catch Consulting, S.C. no asume',
    'responsabilidad por decisiones tomadas con base en los',
    'resultados de este simulador.',
    '',
    'Para informacion, contratacion o autorizacion de uso:',
    'Catch Consulting, S.C. — Desarrollo Organizacional | Recursos Humanos',
    'informacion@catchconsulting.com.mx',
    'Tel. (477) 318 16 00',
    'G100 Business District, Suite 719, Puerto Interior, Silao, GTO.',
    'www.catchconsulting.com.mx',
    '',
    `Rev. ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`,
  ];

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  y = 40;
  for (const line of disclaimerLines) {
    if (line === '') { y += 4; continue; }
    doc.text(line, M, y);
    y += 6;
  }

  pageFooter(doc, totalPages, totalPages);

  // ── Save ─────────────────────────────────────────────────────────────

  const safe = (firm.razonSocial || 'empresa').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Catch_Simulador_LFT_${firm.year}_${safe}.pdf`);
}
