# Implementation Plan: Balance Tracker (Registro de Balance Trabajo/Aprendizaje)

**Branch**: `001-balance-tracker-mvp` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-balance-tracker-mvp/spec.md`

## Summary

Aplicación web local-first (PWA) para registrar minutos de Trabajo vs.
Aprendizaje, con entrada rápida, balance diario, tendencia semanal de 7 días,
corrección solo por eliminación y operación 100% offline. Enfoque técnico:
núcleo TypeScript puro en `src/core` (repositorio Dexie + agregaciones
puras), capa de hooks React (`useDailyBalance`, `useWeeklyTrends`) y
componentes de presentación consumiendo salidas ya agregadas y tipadas;
TDD obligatorio con Vitest + `fake-indexeddb` antes de cualquier UI.

## Technical Context

**Language/Version**: TypeScript 5.x sobre React 18+ / Vite 5+

**Primary Dependencies**: React, Tailwind CSS, `vite-plugin-pwa`,
Dexie.js 4.x, Recharts 2.x; Vitest + `fake-indexeddb` + `@testing-library/react`

**Storage**: IndexedDB local vía Dexie (sin backend, sin endpoints)

**Testing**: Vitest (unidad + integración con BD real en memoria
`fake-indexeddb`); ciclo Red-Green-Refactor estricto (Artículo III)

**Target Platform**: Navegadores modernos (desktop + móvil), instalable
como PWA, funciona offline tras primera carga

**Project Type**: Web app (SPA local-first) — una sola capa cliente

**Performance Goals**: guardar entrada y reflejar balance en <1s percibido;
arranque de la app <2s en local

**Constraints**: 100% offline; solo catálogo de duraciones
15/30/60/120/180/240 min; sin edición de registros (DELETE + recreate);
UI en español, código/BD en inglés

**Scale/Scope**: 1 usuario por dispositivo; 5 componentes UI de primer
nivel (QuickEntryBar, SplitDashboard, WeeklyTrends, entrada de lista,
layout); MVP de 3 capas, sin estado global

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Artículo | Estado | Evidencia en el plan |
|---|----------|--------|----------------------|
| I | Library-First | PASS | Toda lógica en `src/core` (repositorio, agregación, transformación Recharts) como funciones puras; componentes = presentación |
| II | Interfaces tipadas | PASS | Contratos en `contracts/data-layer.md` y `contracts/hooks.md`: `Promise<T>` estrictas, agregados `{ work, learning }` pre-calculados |
| III | TDD estricto | PASS | Orden de tareas: tests rojos de repositorio y agregación antes de montar UI (verbatim en `tasks.md`, fase de diseño) |
| IV | Gobernanza de datos | PASS | Dexie local-first; sin `UPDATE`; corrección = DELETE + recreate (FR-006/FR-007) |
| V | Errores y UI | PASS | Repositorio captura excepciones → error de dominio; UI solo mensajes amigables; reinicio silencioso de QuickEntryBar (FR-008/FR-009) |
| VI | Convenciones e idioma | PASS | Esquema BD en inglés (`category`, `timeValue`, `date`...); UI y specs en español; colores opuestos Trabajo/Aprendizaje |
| VII | 3 capas, sin estado global | PASS | Estructura Data → Integration (`src/hooks`) → Presentation (`src/components`); cero Redux/Zustand |
| VIII | Confianza en el framework | PASS | Dexie y Recharts se usan con APIs nativas; sin wrappers ni adaptadores |
| IX | Pruebas reales | PASS | Vitest + `fake-indexeddb` para toda la capa de persistencia; sin mocks de métodos Dexie |

**Gate result**: PASS (0 violaciones). Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/001-balance-tracker-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── data-layer.md
│   └── hooks.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/                      # Capa 1: Datos (lógica pura + Dexie)
│   ├── db.ts                  # Configuración Dexie (esquema, índices)
│   ├── types.ts               # TimeEntry, Category, DurationValue, agregados
│   ├── time-entry.repo.ts     # CRUD: add/list/delete (sin update)
│   ├── daily-balance.ts       # Agregación pura → { work, learning }
│   └── weekly-trends.ts       # Transformación pura → series Recharts
├── hooks/                     # Capa 2: Integración
│   ├── useDailyBalance.ts
│   ├── useWeeklyTrends.ts
│   └── useTimeEntries.ts
├── components/                # Capa 3: Presentación (UI en español)
│   ├── QuickEntryBar.tsx
│   ├── SplitDashboard.tsx
│   ├── WeeklyTrends.tsx
│   ├── EntryList.tsx
│   └── DayPicker.tsx
├── App.tsx
├── main.tsx
└── index.css                  # Tailwind

tests/
├── unit/                      # Agregaciones puras (daily-balance, weekly-trends)
├── integration/               # Repositorio Dexie con fake-indexeddb
└── component/                 # Rendering de componentes (opcional, última fase)

public/                        # Assets PWA (manifest, icons)
vite.config.ts                 # Vite + vite-plugin-pwa + Vitest config
tailwind.config.js
```

**Structure Decision**: Opción "Single project" web — un solo cliente SPA
con las 3 capas obligatorias del Artículo VII (`src/core`, `src/hooks`,
`src/components`) y carpeta `tests/` espejo. No hay backend ni monorepo.

## Complexity Tracking

> No hay violaciones de la constitución que justificar (ver Constitution Check).
