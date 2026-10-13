# Implementation Plan: Rediseño Visual de la Interfaz con Modo Oscuro/Claro

**Branch**: `004-ui-redesign-dark-mode` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-ui-redesign-dark-mode/spec.md`

## Summary

Rediseñar por completo la interfaz del Balance Tracker con una dirección
editorial: tipografía dual (Instrument Serif para titulares/cifras, Geist
para interfaz), paleta semántica de 5 roles con variantes claro/oscuro
definidas como variables CSS y mapeadas a tokens de Tailwind, dualidad de
colores por categoría (azul acero Trabajo / ocre Aprendizaje) aplicada en
todos los componentes, medidor de equilibrio con veredicto y barra dual
animada, barra de registro rápido pegajosa con selector segmentado
accesible y botones de tiempo teñidos por categoría, tarjetas por categoría
con totales serif grandes, tendencia de 7 días migrada a gráfica de líneas
con pestañas "Horas"/"% Crecimiento", y control sol/luna con preferencia
persistente. Enfoque técnico: tokens de tema en `index.css` + `darkMode:
'class'`; lógica pura nueva en `src/core` (veredicto, agrupación,
porcentajes de crecimiento, resolución de tema) con TDD previo; hooks
nativos (`useTheme`); componentes de presentación reescritos/creados
consumiendo los contratos tipados existentes intactos (Dexie, repositorios
y datos sin cambios). Se usa la skill `frontend-design` como guía de
calidad estética durante la implementación.

## Technical Context

**Language/Version**: TypeScript 5.8 sobre React 18.3 / Vite 6.3
(proyecto existente)

**Primary Dependencies**: React 18, Dexie 4 (sin cambios), Recharts 2.15
(migración BarChart → LineChart con API nativa), Tailwind CSS 3.4
(`darkMode: 'class'`); **nuevas**: `lucide-react` (iconos),
`class-variance-authority` + `clsx` + `tailwind-merge` (primitivo Button
tipo shadcn), `@fontsource/instrument-serif` + `@fontsource-variable/geist-sans`
(fuentes auto-alojadas, offline)

**Storage**: IndexedDB vía Dexie **sin cambios** (Artículo IV intacto);
nueva preferencia de tema en `localStorage` (dato de UI, no de dominio —
ver research R6)

**Testing**: Vitest 3 + fake-indexeddb (integración) + jsdom/RTL
(componentes); Red-Green-Refactor obligatorio para toda lógica nueva de
`src/core` (Artículo III)

**Target Platform**: Navegadores modernos, PWA offline (fuentes y assets
incluidos en el precache de workbox)

**Project Type**: Web app SPA local-first — rediseño de presentación
incremental sobre las 3 capas existentes (core/hooks/components), más 1
primitivo UI compartido (`ui/Button`)

**Performance Goals**: cambio de tema instantáneo (< 1 frame percibido,
sin recarga); animación del medidor 700 ms con `transition-[width]`;
render de la gráfica de 7 puntos sin jank; registro < 10 s (SC-002)

**Constraints**: sin estado global (Artículo VII); código EN / UI ES
(Artículo VI); lógica de presentación derivada (veredicto, agrupación,
crecimiento) en funciones puras de `src/core` testeables sin React
(Artículo I); datos y esquema Dexie intocables (FR-012); mensajes de
error amigables, role `alert`/`status` (Artículo V); accesibilidad:
radiogroup, meter, aria-label, foco `ring` (FR-011); mobile-first, sin
scroll horizontal desde 320px (FR-010)

**Scale/Scope**: 1 usuario local; ~4 funciones puras nuevas/extendidas en
core + 1 hook nuevo + ~9 componentes nuevos/reescritos + deltas en
`App`/`index.css`/`index.html`/tailwind config; ~8 archivos de pruebas
nuevos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Artículo | Estado | Evidencia en el plan |
|---|----------|--------|----------------------|
| I | Library-First | PASS | Toda lógica derivada vive en core puro: `balance-verdict.ts`, `entry-grouping.ts`, `growth-series.ts` (en `weekly-trends.ts`), `theme.ts`; componentes son presentación que consume contratos tipados |
| II | Interfaces tipadas | PASS | Contratos en `contracts/`: `computeBalanceVerdict → BalanceVerdict`, `groupEntriesByCategory → CategoryEntries`, `computeGrowthSeries → GrowthPoint[]`, `resolveInitialTheme/toggleTheme`, `useTheme → { theme, toggle }`; la UI recibe structs ya resueltos |
| III | TDD estricto | PASS | Tests rojos de unidades core (`balance-verdict`, `entry-grouping`, `growth-series`, `theme`) y luego componentes (RTL) antes de implementar cada pieza, en ese orden verbatim en tasks.md |
| IV | Gobernanza de datos | PASS | Cero escrituras nuevas sobre Dexie; esquema `TimeEntry` intacto; el tema se persiste en `localStorage` (preferencia de UI, no dato de dominio — justificado en research R6, no requiere enmienda) |
| V | Errores y UI | PASS | `QuickEntryBar` conserva reinicio silencioso y toasts `role="status"`; validación inline pasa a `role="alert"`; ningún error técnico visible |
| VI | Convenciones e idioma | PASS | Nombres de archivos/funciones/tipos EN (`BalanceVerdict`, `useTheme`, `CategoryCard`); toda UI en español ("Hoy", "Registrar", "Trabajo"/"Aprendizaje", veredictos) |
| VII | 3 capas, sin estado global | PASS | Core puro + hooks nativos (`useTheme` es el único hook nuevo) + presentación; `ui/Button` es primitivo de vista, no capa adicional; estado del tema vive en `document.documentElement` + localStorage, no en store |
| VIII | Confianza en el framework | PASS | Recharts se usa con su API nativa (`LineChart`, `Line`, `ReferenceLine`); Tailwind con sus tokens; Dexie no se toca; sin wrappers sobre librerías |
| IX | Pruebas reales | PASS | Sin lógica Dexie nueva; las pruebas de integración existentes deben permanecer verdes como regresión; nuevas pruebas de componentes en jsdom con la misma RTL ya adoptada |

**Gate result**: PASS (0 violaciones). Complexity Tracking vacío.

**Re-check post-Phase 1** (tras `research.md`, `data-model.md`,
`contracts/` y `quickstart.md`): PASS — 0 violaciones nuevas. El diseño
confirma: (a) cero escrituras nuevas sobre Dexie y esquema intacto
(data-model §5); (b) toda lógica derivada (veredicto, agrupación,
crecimiento, tema) queda en core puro con contrato y tests TDD
(contracts/); (c) el uso de `localStorage` para el tema no gobierna datos
de dominio (research R6, Artículo IV); (d) Recharts y Tailwind se usan
con sus APIs nativas sin wrappers (research R1/R5, Artículo VIII); (e) el
script anti-FOUC es la única duplicación deliberada de reglas, mínima y
justificada (contracts/theme-contract §3).

## Project Structure

### Documentation (this feature)

```text
specs/004-ui-redesign-dark-mode/
├── plan.md                 # Este archivo (/speckit.plan)
├── spec.md                 # Entrada del comando
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/
│   ├── balance-verdict-contract.md
│   ├── entry-grouping-contract.md
│   ├── trend-growth-contract.md
│   ├── theme-contract.md
│   └── ui-primitives-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md                # Phase 2 (/speckit.tasks — NO creado por /speckit.plan)
```

### Source Code (repository root — deltas sobre el estado actual)

```text
index.html                  # Ampliado: script anti-FOUC de tema + lang es
src/
├── index.css               # Reescrito: variables CSS de tema (claro/.dark),
│                           #   escala de radio, familias tipográficas,
│                           #   grises derivados con color-mix
├── main.tsx                # Delta menor: imports de fontsource
├── App.tsx                 # Reescrito: layout max-w-6xl, orquesta secciones
├── core/
│   ├── balance-verdict.ts  # Nuevo: veredicto + porcentajes (puro)
│   ├── entry-grouping.ts   # Nuevo: agrupación por categoría (puro)
│   ├── theme.ts            # Nuevo: resolveInitialTheme/toggleTheme (puro)
│   └── weekly-trends.ts    # Ampliado: computeGrowthSeries (puro)
├── hooks/
│   └── useTheme.ts         # Nuevo: tema + persistencia localStorage
└── components/
    ├── ui/
    │   ├── cn.ts           # Nuevo: utilidad clsx + tailwind-merge
    │   └── Button.tsx      # Nuevo: variantes default/outline/ghost/icon
    ├── AppHeader.tsx       # Nuevo: eyebrow bicolor, título+fecha, DayNav,
    │                       #   transferencias, ThemeToggle
    ├── DayNav.tsx          # Nuevo: anterior / Hoy / siguiente (outline)
    ├── ThemeToggle.tsx     # Nuevo: sol/luna con aria-label
    ├── QuickEntryBar.tsx   # Reescrito: sticky, input grande, radiogroup,
    │                       #   botones de tiempo teñidos, "Registrar"+Enter
    ├── CategorySelector.tsx# Nuevo: role="radiogroup" segmentado
    ├── BalanceMeter.tsx    # Nuevo: veredicto serif, barra h-3 dual, marca 50%
    ├── CategoryCard.tsx    # Nuevo: cabecera teñida 10%, total serif 60px,
    │                       #   lista de entradas, estado vacío
    ├── EntryList.tsx       # Reescrito: filas compactas dentro de CategoryCard
    │                       #   (conserva editar/eliminar de la feature 003)
    ├── EditEntryForm.tsx   # Delta: hereda tokens del nuevo diseño
    ├── WeeklyTrends.tsx    # Reescrito: LineChart, pestañas, leyenda corta
    ├── DataTransferButtons.tsx # Delta: variantes Button outline/ghost + iconos
    ├── DayPicker.tsx       # Eliminado (reemplazado por DayNav)
    └── categoryLabels.ts   # Sin cambios
tests/
├── unit/
│   ├── balance-verdict.test.ts    # Nuevo
│   ├── entry-grouping.test.ts     # Nuevo
│   ├── theme.test.ts              # Nuevo
│   └── weekly-trends.test.ts      # Ampliado: crecimiento %
├── component/
│   ├── ThemeToggle.test.tsx       # Nuevo
│   ├── CategorySelector.test.tsx  # Nuevo
│   ├── BalanceMeter.test.tsx      # Nuevo
│   ├── CategoryCard.test.tsx      # Nuevo
│   ├── DayNav.test.tsx            # Nuevo
│   ├── WeeklyTrends.test.tsx      # Nuevo
│   ├── QuickEntryBar.test.tsx     # Ampliado: radiogroup, teñido, sticky
│   └── [existentes]               # Actualizados a los nuevos selectores/roles
└── [integración existentes]       # Deben permanecer verdes (regresión)
```

**Structure Decision**: Se mantiene la estructura de 3 capas existente
(`src/core`, `src/hooks`, `src/components`) sin añadir carpetas nuevas
fuera de `components/ui/` (primitivos de vista) y `contracts/` en la
documentación del feature. `DayPicker.tsx` se elimina porque la navegación
por días se resuelve con `DayNav` en la cabecera (FR-004).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones. Complexity Tracking vacío.
