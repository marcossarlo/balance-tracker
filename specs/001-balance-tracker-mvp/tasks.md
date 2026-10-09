---

description: "Task list template for feature implementation"
---

# Tasks: Balance Tracker (Registro de Balance Trabajo/Aprendizaje)

**Input**: Design documents from `/specs/001-balance-tracker-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **REQUIRED** — la constitución (Artículo III, TDD estricto, e
Artículo IX, pruebas con BD real en memoria) exige tests en rojo antes de
cada implementación. Todos los tests usan Vitest + `fake-indexeddb`; sin
mocks de Dexie.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project web app (per plan.md): `src/` y `tests/` en la raíz del
repositorio; 3 capas: `src/core` (datos), `src/hooks` (integración),
`src/components` (presentación).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Scaffold Vite + React + TypeScript project per plan.md (package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/App.tsx placeholder) at repository root
- [ ] T002 [P] Configure Tailwind CSS in tailwind.config.js and src/index.css
- [ ] T003 [P] Configure Vitest + `fake-indexeddb` global setup in vite.config.ts and tests/setup.ts (fresh in-memory DB per suite; no Dexie mocks per Artículo IX)
- [ ] T004 [P] Create directory skeleton per plan.md: src/core/, src/hooks/, src/components/, tests/unit/, tests/integration/, tests/component/

**Checkpoint**: `npm run dev` y `npm test` funcionan con suite vacía.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, DB schema and error model that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create core types in src/core/types.ts: `Category = 'WORK' | 'LEARNING'`, `DURATION_VALUES = [15, 30, 60, 120, 180, 240] as const`, `DurationValue`, `TimeEntry` (id UUID, category, description, timeValue, date 'YYYY-MM-DD', timestampCreation), `DailyBalance { work, learning, total }`, `WeeklyTrendPoint { date, label, work, learning }` per contracts/data-layer.md
- [ ] T006 Create Dexie schema v1 in src/core/db.ts: table `timeEntries` with PK `&id`, index `date` (non-unique) and compound index `[date+category]` per research.md R-01
- [ ] T007 [P] Create domain error model in src/core/errors.ts: `RepositoryErrorCode = 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' | 'VALIDATION' | 'UNKNOWN'` and `RepositoryError` class per data-model.md; map native IndexedDB exceptions (QuotaExceededError, AbortError, InvalidStateError) to codes per research.md R-06
- [ ] T008 [P] Create test DB helper in tests/helpers/db.ts: returns a fresh Dexie instance backed by fake-indexeddb per suite (per data-model.md, índice `date` real)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Registro rápido de tiempo (Priority: P1) 🎯 MVP

**Goal**: Registrar entradas (categoría, descripción, duración del catálogo) con guardado offline y reinicio automático de la barra.

**Independent Test**: Guardar varias entradas y verificar que quedan persistidas y listas para consulta (quickstart V3); validación de datos faltantes con aviso en español.

### Tests for User Story 1 ⚠️ (WRITE FIRST — MUST FAIL BEFORE IMPLEMENTATION)

- [ ] T009 [P] [US1] Failing integration tests for `createTimeEntry` in tests/integration/time-entry-create.test.ts: persists entry with local `date` YYYY-MM-DD of today, assigns UUID `id`, sets `timestampCreation`, returns typed `TimeEntry` (Artículo IX: real fake-indexeddb, no Dexie mocks)
- [ ] T010 [P] [US1] Failing validation tests in tests/integration/time-entry-validation.test.ts: rejects `category` outside `'WORK' | 'LEARNING'` with code `'VALIDATION'`; rejects `timeValue` outside `DURATION_VALUES` (ej. 45) with code `'VALIDATION'`; rejects empty/whitespace description and >200 chars
- [ ] T011 [US1] Run `npm test` and confirm T009/T010 fail RED before any production code in tests/integration/time-entry-create.test.ts and tests/integration/time-entry-validation.test.ts (Artículo III)

### Implementation for User Story 1

- [ ] T012 [US1] Implement `createTimeEntry` with validation in src/core/time-entry.repo.ts (constraints quoted: category enum, `timeValue` ∈ {15,30,60,120,180,240}, description trimmed 1..200 chars; wraps native IDB exceptions as `RepositoryError`) — turns T009/T010 GREEN
- [ ] T013 [US1] Implement `listEntriesByDate(date)` using Dexie native `where('date').equals(...)` in src/core/time-entry.repo.ts (Artículo VIII: sin wrappers)
- [ ] T014 [US1] Implement `useTimeEntries(date)` hook in src/hooks/useTimeEntries.ts: local state, `save()` resolving `{ ok: true, entry } | { ok: false, code }` (never rejects), `refresh()` per contracts/hooks.md
- [ ] T015 [P] [US1] Create QuickEntryBar component in src/components/QuickEntryBar.tsx: selector Trabajo/Aprendizaje (colores opuestos), input descripción, botones de duración 15/30/60/120/180/240 min, labels en español, reset automático y silencioso tras guardar con éxito (FR-008), avisos amigables sin stack traces (FR-009)
- [ ] T016 [P] [US1] Create EntryList component in src/components/EntryList.tsx: lista de entradas del día con etiquetas en español (Trabajo/Aprendizaje, duración, descripción)
- [ ] T017 [US1] Wire US1 in src/App.tsx: QuickEntryBar + EntryList + useTimeEntries para el día de hoy
- [ ] T018 [US1] Component test in tests/component/QuickEntryBar.test.tsx: on save success form resets silently; on `{ ok: false }` shows friendly Spanish notification and form state preserved

**Checkpoint**: US1 fully functional and testable independently (MVP).

---

## Phase 4: User Story 2 - Balance diario (Priority: P2)

**Goal**: Mostrar totales separados de Trabajo y Aprendizaje para el día seleccionado.

**Independent Test**: Registrar 120 min Trabajo + 30 min Aprendizaje y verificar balance "120/30" con colores opuestos; día sin registros ⇒ ceros (quickstart V4).

### Tests for User Story 2 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T019 [P] [US2] Failing unit tests for pure `computeDailyBalance(entries)` in tests/unit/daily-balance.test.ts: sums `timeValue` by `category` into `{ work, learning, total }` minutes; empty array ⇒ all zeros; ignores entries from other dates
- [ ] T020 [P] [US2] Failing integration tests for `getDailyBalance(date)` in tests/integration/daily-balance.test.ts: uses the `date` index (entries on scattered days return only target-day totals); no entries ⇒ `{ work: 0, learning: 0, total: 0 }`
- [ ] T021 [US2] Run `npm test` and confirm T019/T020 fail RED in tests/unit/daily-balance.test.ts and tests/integration/daily-balance.test.ts (Artículo III)

### Implementation for User Story 2

- [ ] T022 [US2] Implement pure `computeDailyBalance` in src/core/daily-balance.ts (Función pura, sin IO — Artículo I) — turns T019 GREEN
- [ ] T023 [US2] Implement `getDailyBalance(date)` in src/core/time-entry.repo.ts delegating to the pure function — turns T020 GREEN
- [ ] T024 [US2] Implement `useDailyBalance(date)` hook in src/hooks/useDailyBalance.ts: `{ balance, loading, error, refresh }`, always-defined zeros, per contracts/hooks.md
- [ ] T025 [P] [US2] Create SplitDashboard component in src/components/SplitDashboard.tsx: "Trabajo" vs "Aprendizaje" totals in minutes with contrastante opposite colors (Artículo VI), Spanish labels, empty-state friendly
- [ ] T026 [P] [US2] Create DayPicker component in src/components/DayPicker.tsx: select consultation day, labels in Spanish
- [ ] T027 [US2] Wire US2 in src/App.tsx: DayPicker + SplitDashboard consuming `useDailyBalance`, refresh after save/delete

**Checkpoint**: US1 AND US2 both work independently.

---

## Phase 5: User Story 3 - Tendencia semanal (Priority: P3)

**Goal**: Gráfica de los últimos 7 días comparando Trabajo vs. Aprendizaje.

**Independent Test**: Con registros en 3 días distintos, la gráfica muestra 7 puntos en orden cronológico con totales correctos y días vacíos en cero (quickstart V5).

### Tests for User Story 3 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T028 [P] [US3] Failing unit tests for pure `computeWeeklyTrends(entries, weekDates)` in tests/unit/weekly-trends.test.ts: always returns exactly 7 `WeeklyTrendPoint`; chronological order; missing days ⇒ `work: 0, learning: 0`; `label` format `dd/mm`
- [ ] T029 [P] [US3] Failing integration tests for `listEntriesByRange` + `getWeeklyTrends` in tests/integration/weekly-trends.test.ts: `where('date').between(start, end, inclusive)` over the `date` index; returns 7 points regardless of data presence
- [ ] T030 [US3] Run `npm test` and confirm T028/T029 fail RED in tests/unit/weekly-trends.test.ts and tests/integration/weekly-trends.test.ts (Artículo III)

### Implementation for User Story 3

- [ ] T031 [US3] Implement pure `computeWeeklyTrends` in src/core/weekly-trends.ts (pure transform to Recharts shape — Artículo I/II; UI never transforms) — turns T028 GREEN
- [ ] T032 [US3] Implement `listEntriesByRange(startDate, endDate)` and `getWeeklyTrends(endDate)` in src/core/time-entry.repo.ts (default endDate = local today) — turns T029 GREEN
- [ ] T033 [US3] Implement `useWeeklyTrends(endDate?)` hook in src/hooks/useWeeklyTrends.ts: `{ points, loading, error, refresh }`, exactly 7 points, per contracts/hooks.md
- [ ] T034 [US3] Create WeeklyTrends component in src/components/WeeklyTrends.tsx: Recharts consumed directly with `dataKey="work"` / `dataKey="learning"` (Artículo VIII: sin wrappers), Spanish legend/axis labels, 7 days always visible
- [ ] T035 [US3] Wire US3 in src/App.tsx: WeeklyTrends consuming `useWeeklyTrends`

**Checkpoint**: All read-side stories (US1–US3) independently functional.

---

## Phase 6: User Story 4 - Corrección mediante eliminación (Priority: P4)

**Goal**: Eliminar entradas erróneas (único mecanismo de corrección, sin edición).

**Independent Test**: Crear → eliminar → verificar desaparece de balance y tendencia; fallo de BD ⇒ entrada visible + notificación amigable (quickstart V6).

### Tests for User Story 4 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T036 [P] [US4] Failing integration tests for `deleteTimeEntry(id)` in tests/integration/time-entry-delete.test.ts: removes record (subsequent `listEntriesByDate` excludes it); idempotent (deleting nonexistent id resolves without error); existing entries unaffected; native IDB failure maps to `RepositoryError` code
- [ ] T037 [US4] Run `npm test` and confirm T036 fails RED in tests/integration/time-entry-delete.test.ts (Artículo III)

### Implementation for User Story 4

- [ ] T038 [US4] Implement `deleteTimeEntry(id)` in src/core/time-entry.repo.ts — turns T036 GREEN; NO `update`/`put` functions exist anywhere in src/core (Artículo IV)
- [ ] T039 [US4] Add `remove(id)` to src/hooks/useTimeEntries.ts: resolves `{ ok } | { ok: false, code }`, triggers `refresh` of balance/trends hooks on success
- [ ] T040 [US4] Add delete affordance to src/components/EntryList.tsx: "Eliminar" button with native `confirm()` in Spanish before calling `remove` (research.md R-09); friendly Spanish notification on `{ ok: false }` and entry remains visible (FR-009, edge case)
- [ ] T041 [US4] Component test in tests/component/EntryList.test.tsx: cancel confirm keeps entry; confirm removes it from DOM; failed remove shows friendly notification and keeps entry rendered

**Checkpoint**: Correction loop complete; all 4 core stories work independently.

---

## Phase 7: User Story 5 - Uso sin conexión (Priority: P5)

**Goal**: App 100% operativa offline tras primera carga (PWA instalable).

**Independent Test**: Cargar app, desconectar red, registrar/balance/tendencia/eliminar operativos y datos sobreviven a recarga (quickstart V7).

### Tests for User Story 5

- [ ] T042 [P] [US5] Configure `vite-plugin-pwa` in vite.config.ts per research.md R-05: `registerType: 'autoUpdate'`, Workbox `globPatterns` precaching shell (HTML/CSS/JS/manifest); generate manifest with Spanish app name
- [ ] T043 [P] [US5] Add PWA icons and manifest assets under public/

### Implementation for User Story 5

- [ ] T044 [US5] Verify offline scenario per specs/001-balance-tracker-mvp/quickstart.md V7: `npm run build && npm run preview`, load once, DevTools offline, register/balance/trends/delete functional, data persists after reload — record result
- [ ] T045 [US5] Add unit/integration regression test asserting data survives simulated DB reopen in tests/integration/persistence.test.ts (reopen Dexie instance, same fake-indexeddb backend, entries still present)

**Checkpoint**: Offline parity with online behavior confirmed.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 [P] Run full test suite `npm test` — all GREEN in tests/, no skipped tests
- [ ] T047 [P] Grep audit: no `update(`/`put(` in src/core (Artículo IV), no global store imports (Redux/Zustand — Artículo VII), no wrappers over Dexie/Recharts (Artículo VIII)
- [ ] T048 [P] UI language audit: all visible strings in Spanish, Trabajo/Aprendizaje contrast colors (Artículo VI) in src/components/
- [ ] T049 Execute scenarios V1–V8 in specs/001-balance-tracker-mvp/quickstart.md end-to-end and record results
- [ ] T050 Red-Green-Refactor final pass: refactor duplicated code in src/core and src/hooks keeping all tests green (Artículo III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; reads entries created by US1 flows (needs `createTimeEntry` only as fixture)
- **User Story 3 (Phase 5)**: Depends on Foundational; uses `date` index proven in US1/US2 tests
- **User Story 4 (Phase 6)**: Depends on US1 (deletes entries created by US1; extends `EntryList` y `useTimeEntries` de US1)
- **User Story 5 (Phase 7)**: Depends on US1–US4 para validar el flujo completo offline
- **Polish (Phase 8)**: Depends on all desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational only — independent
- **US2 (P2)**: After Foundational only (fixtures via repo API) — independent
- **US3 (P3)**: After Foundational only — independent
- **US4 (P4)**: Requires US1 (EntryList + useTimeEntries exist)
- **US5 (P5)**: Requires US1–US4 for full offline validation

### Within Each User Story

- Tests MUST be written and FAIL (RED) before implementation (Artículo III)
- Core pure functions → repository → hooks → components → App wiring
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004 en paralelo (Setup)
- T007, T008 en paralelo (Foundational, archivos distintos)
- Dentro de cada historia: todos los tests `[P]` en paralelo, luego implementación; componentes `[P]` en paralelo
- US2 y US3 pueden avanzar en paralelo tras Foundational (archivos distintos)

---

## Parallel Example: User Story 1

```bash
# En paralelo (archivos distintos, tests en rojo primero):
Task: "Failing integration tests createTimeEntry in tests/integration/time-entry-create.test.ts"
Task: "Failing validation tests in tests/integration/time-entry-validation.test.ts"

# Tras confirmar RED, implementación secuencial del repo:
Task: "Implement createTimeEntry + validation in src/core/time-entry.repo.ts"

# Luego en paralelo:
Task: "QuickEntryBar in src/components/QuickEntryBar.tsx"
Task: "EntryList in src/components/EntryList.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (tests rojos → implementación → verdes)
4. **STOP and VALIDATE**: quickstart V1–V3
5. Demo: registrar entradas funciona offline

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate → MVP
3. US2 → validate (V4) → valor informativo
4. US3 → validate (V5) → visión semanal
5. US4 → validate (V6) → corrección completa
6. US5 → validate (V7–V8) → offline + errores amigables
7. Polish → V1–V8 completo, auditorías de constitución

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational: Dev A = US1, Dev B = US2/US3, Dev C = US5 (PWA)
3. US4 asignada a quien complete US1 primero

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests are MANDATORY (Artículo III) — never skip RED phase
- Tests use fake-indexeddb real DB — never mock Dexie (Artículo IX)
- Commit after each task or logical group (mensajes en inglés, Artículo VI)
- Stop at any checkpoint to validate story independently
- No `UPDATE` operations ever — correction = delete + recreate (Artículo IV)
