# Simulador de Jornada Laboral — Catch Consulting, S.C.

> ® Prohibido el uso o distribución sin autorización expresa de **Catch Consulting, S.C.**
> www.catchconsulting.com.mx

Herramienta web para verificar el cumplimiento de jornadas laborales conforme a la **Ley Federal del Trabajo (LFT)** y la **reforma constitucional 2026–2030** que reduce progresivamente la semana laboral máxima hasta 40 horas.

---

## Funcionalidades

- Calcula horas regulares, **dobles (2×)** y **triples (3×)** por tripulación
- Auto-detecta el tipo de jornada (Diurna / Mixta / Nocturna) per **Art. 60 LFT**
- Valida cumplimiento contra **Arts. 59, 65, 66, 67 y 68 LFT**
- Soporte para turnos nocturnos que cruzan la medianoche
- Cálculo de costo de tiempo extra semanal por tripulación
- **Exportación a PDF** (reporte de cumplimiento con branding Catch)
- **Exportación a Excel** (libro con hoja resumen + hoja por tripulación)
- Datos persistidos en `localStorage` (sobreviven a recargas de página)
- Progresión automática de límites legales 2026 → 2027 → 2028 → 2029 → 2030

---

## Inicio rápido

```bash
npm install
npm run dev        # servidor local en http://localhost:5173
npm run build      # build de producción en /dist
```

---

## Ícono de la aplicación

El encabezado muestra un **ícono personalizado** si se coloca un archivo en la siguiente ruta:

```
public/app-icon.png
```

### Especificaciones técnicas del ícono

| Propiedad | Valor requerido |
|-----------|----------------|
| **Formato** | PNG con fondo transparente |
| **Dimensiones** | 128 × 128 px (mínimo recomendado) |
| **Relación de aspecto** | 1:1 (cuadrado) |
| **Resolución** | 72–144 dpi (o 2× para Retina: 256 × 256 px) |
| **Espacio de color** | sRGB |
| **Canal alfa** | Requerido (transparencia) |

> Si el archivo no existe o falla al cargar, el espacio del ícono se oculta automáticamente sin afectar el layout.

Un archivo transparente de 128×128 px de marcador de posición ya está incluido en `public/app-icon.png`. Reemplázalo con el ícono oficial de Catch Consulting cuando esté disponible.

---

## Logo Catch Consulting

El logo de Catch Consulting (`src/assets/catch-logo.png`) se muestra en blanco en el encabezado mediante un filtro CSS (`filter: brightness(0) invert(1)`).

Si se requiere actualizar el logo, reemplaza el archivo manteniendo el mismo nombre. Dimensiones recomendadas: **altura mínima de 40 px**, fondo transparente o blanco.

---

## Estructura del proyecto

```
src/
  assets/
    catch-logo.png        — Logo Catch Consulting (extraído del Excel maestro)
    sunrise-banner.png    — Ilustración día-noche (fondo del encabezado)
  components/
    FirmHeader.tsx        — Encabezado: logo, datos de empresa, configuración global
    ReferenceTable.tsx    — Tabla de referencia LFT (colapsable)
    ScheduleGrid.tsx      — Cuadrícula de horario semanal (7 días)
    CrewCard.tsx          — Tarjeta por tripulación: horario + resultados + cumplimiento
    SummaryPanel.tsx      — Panel resumen de la empresa
    ExportButtons.tsx     — Botones de exportación PDF y Excel
  data/
    lft.ts                — Tipos, tabla de referencia LFT y motor de cálculo
  export/
    pdfReport.ts          — Generación de reporte PDF (jsPDF + jspdf-autotable)
    excelReport.ts        — Generación de libro Excel (SheetJS/xlsx)
  hooks/
    useLocalStorage.ts    — Hook genérico de persistencia en localStorage
  App.tsx                 — Componente raíz, orquesta estado y cálculos
  main.tsx                — Punto de entrada de la aplicación
public/
  app-icon.png            — Marcador de posición (reemplazar con ícono oficial)
```

---

## Base legal

| Artículo | Contenido |
|----------|-----------|
| Art. 58–61 LFT | Definición y límites de jornadas diurna, mixta y nocturna |
| Art. 60 LFT | Clasificación de jornada mixta (> 3.5h nocturnas = nocturna) |
| Art. 65–66 LFT | Tiempo extraordinario: máx. 3h/día, máx. 3 días/semana |
| Art. 67 LFT | Pago de horas dobles (2×) para las primeras horas extra |
| Art. 68 LFT | Pago de horas triples (3×) para horas extra que exceden el límite de dobles |
| Art. 123 Constitución | Reforma progresiva 2026–2030 de la semana laboral máxima |

---

## Aviso legal

® Prohibido el uso o distribución sin autorización expresa de Catch Consulting, S.C.
Esta herramienta es de carácter informativo y no constituye asesoría jurídica.
Catch Consulting, S.C. no asume responsabilidad por decisiones tomadas con base en los resultados de este simulador.
