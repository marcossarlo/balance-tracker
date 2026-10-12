---

description: "Task list template for feature implementation"
---

# Tasks: Editar Entradas del Día

**Input**: Design documents from `/specs/003-edit-day-entries/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **REQUIRED** — constitución Art. III (TDD estricto) y Art. IX
(fake-indexeddb real; un único y documentado spy de `add` para rollback,
research R-06). Tests en rojo antes de cada implementación.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Feature incremental sobre el proyecto existente: `src/core`, `src/hooks`,
`src/components`, `tests/` en la raíz del repositorio.

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirmar base sana antes de tocar código

- [ ] T001 Run baseline verification: `npm test` and `npx tsc -b` at repository root must be green before starting (suite actual de las features 001–002)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipo de entrada de la operación de reemplazo que ambas historias necesitan

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Add `EditTimeEntryInput` interface to src/core/time-entry.repo.ts: `{ id: string; category: Category; description: string; timeValue: DurationValue }` per contracts/edit-entry-contract.md — **sin campo `date`** deliberadamente ("la fecha la fija el repositorio desde la fila original", FR-004, research R-02). Solo la interfaz; la función llega en la fase de US1

**Checkpoint**: Foundation ready — US1 and US2 can begin.

---

## Phase 3: User Story 1 - Corregir una entrada desde la lista del día (Priority: P1) 🎯 MVP

**Goal**: Botón "Editar" en cada entrada del día con formulario inline prellenado; al guardar, la entrada se reemplaza (borrar-y-recrear, fecha preservada) y balance/tendencias se actualizan.

**Independent Test**: Crear una entrada, pulsar "Editar", cambiar la descripción, "Guardar" ⇒ la lista muestra la nueva descripción y el balance diario refleja el cambio (quickstart V1/V5/V6/V7).

### Tests for User Story 1 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T003 [P] [US1] Failing integration tests for `replaceTimeEntry` in tests/integration/time-entry-replace.test.ts (fake-indexeddb real, Artículo IX): (a) éxito — crear entrada WORK 60min vía `createTimeEntry`, reemplazarla con LEARNING 120min 'Descripción B' ⇒ retorna `TimeEntry` con UUID nuevo, `date === getLocalToday()` preservada, campos actualizados, descripción recortada (trim), `timestampCreation` >= original, fila con el `id` original eliminada, exactamente una fila en la fecha, `getDailyBalance` refleja el tiempo movido de WORK a LEARNING; (b) validación — `category: 'OTHER'`, `timeValue: 45`, `description: ''` ⇒ `RepositoryError('VALIDATION')` con BD intacta; (c) id inexistente `'no-existe'` ⇒ `RepositoryError('VALIDATION')`, BD intacta; (d) rollback — parchar puntualmente `db.timeEntries.add` con spy de vitest para lanzar una vez ⇒ error mapeado, **la fila original permanece intacta**, y un reemplazo posterior tras restaurar el spy funciona (research R-06, spy restaurado en `afterEach`)
- [ ] T004 [P] [US1] Failing component tests for EditEntryForm in tests/component/EditEntryForm.test.tsx (jsdom): valores prellenados desde `entry` (categoría, descripción, duración); "Guardar" llama `onReplace` con `{ id, category, description, timeValue }` visibles; descripción vacía + "Guardar" ⇒ mensaje de validación ES, `onReplace` no se llama, formulario abierto; "Cancelar" ⇒ `onCancel` sin `onReplace`; `onReplace` resuelve `{ ok: false, code: 'UNKNOWN' }` ⇒ toast `role="status"` ES ("No se pudo editar…") y formulario permanece abierto; "Guardar" deshabilitado mientras la promesa está en vuelo (research R-08)
- [ ] T005 [US1] Run `npm test` and confirm T003/T004 fail RED in tests/integration/time-entry-replace.test.ts and tests/component/EditEntryForm.test.tsx (Artículo III)

### Implementation for User Story 1

- [ ] T006 [US1] Implement `replaceTimeEntry(input: EditTimeEntryInput): Promise<TimeEntry>` in src/core/time-entry.repo.ts per research R-01/R-02/R-03 and contracts/edit-entry-contract.md: `assertValidEntryFields(input)` → `db.timeEntries.get(input.id)` (si no existe ⇒ `RepositoryError('VALIDATION')`) → `db.transaction('rw', db.timeEntries, ...)` con `delete(id)` + `add(nuevo)` donde el nuevo registro preserva la `date` de la fila original, recibe `crypto.randomUUID()` y `Date.now()` → retorna el `TimeEntry` persistido; **cero llamadas a `update`/`put`** (Artículo IV + FR-008) — turns T003 GREEN
- [ ] T007 [P] [US1] Implement EditEntryForm component in src/components/EditEntryForm.tsx per research R-04/R-08 and contracts/edit-entry-contract.md: props `{ entry, onReplace, onCancel }`; estructura de campos espejo de QuickEntryBar (botones categoría Trabajo/Aprendizaje, input descripción `maxLength=200`, botones duración `DURATION_VALUES`) con valores de `entry` prellenados; pre-validación de presentación (categoría, descripción no vacía, duración) con mensajes ES; botones "Guardar"/"Cancelar"; estado `saving` que deshabilita "Guardar" en vuelo; toast `role="status"` ES amigable con `ERROR_MESSAGES` propio (incluye `VALIDATION`: "No se pudo editar: la entrada ya no existe o los datos son inválidos."); el formulario solo se cierra en éxito o cancelación — turns T004 GREEN
- [ ] T008 [P] [US1] Add `replace(input: EditTimeEntryInput): Promise<SaveResult>` to the hook in src/hooks/useTimeEntries.ts per contracts/edit-entry-contract.md: mismo patrón try/`replaceTimeEntry`/`refresh()`/resultado tipado que `save`/`remove`; errores vía `toRepositoryErrorCode`; nunca reject
- [ ] T009 [US1] Failing component tests for EntryList edit flows in tests/component/EntryList.test.tsx (extender archivo existente, jsdom): botón "Editar" visible en cada fila abre `EditEntryForm` prellenado con los datos de ESA fila; al editar otra fila solo hay un formulario a la vez; guardado exitoso (`onReplace` ⇒ ok) cierra el formulario y la fila muestra los datos nuevos; "Cancelar" cierra y restaura la fila original; lista en `loading` ⇒ sin botón "Editar" (edge case del spec)
- [ ] T010 [US1] Extend EntryList component in src/components/EntryList.tsx per contracts/edit-entry-contract.md: nueva prop opcional `onReplace`; estado local `editingId`; botón "Editar" (ES) por fila; la fila en edición renderiza `EditEntryForm` inline (con `onCancel` que limpia `editingId`) en lugar de sus controles normales; en éxito de `onReplace` limpia `editingId` (la lista refrescada la provee el hook vía App) — turns T009 GREEN
- [ ] T011 [US1] Wire edit flow into src/App.tsx per contracts/edit-entry-contract.md y research R-05: `handleReplace` análogo a `handleRemove` — llama `replace(input)` del hook y, en éxito, `refreshAll()` (balance diario + tendencias semanales, FR-005); pasa `onReplace={handleReplace}` a `EntryList`

**Checkpoint**: US1 fully functional — user can correct any of today's entries (quickstart V1/V5/V6 + mitad de V7).

---

## Phase 4: User Story 2 - Editar entradas de días pasados (Priority: P2)

**Goal**: La edición funciona igual para entradas de días pasados seleccionados en el selector de día: el registro permanece en su fecha original.

**Independent Test**: Seleccionar un día pasado, pulsar "Editar" en una entrada de ese día, modificar la duración, "Guardar" ⇒ la entrada permanece asociada a su fecha original (quickstart V2 + V7).

**Depends on**: US1 (`replaceTimeEntry` y la UI de edición implementadas en la Fase 3; esta historia añade la cobertura que bloquea el movimiento de fechas, FR-004/FR-010).

### Tests for User Story 2 ⚠️ (WRITE FIRST)

> Estos tests pasan de inmediato dado que `replaceTimeEntry` (US1) preserva la fecha de la fila original; bloquean regresiones que muevan entradas a hoy (research R-02).

- [ ] T012 [US2] Add past-day integration tests to tests/integration/time-entry-replace.test.ts: insertar entrada con `date: '2020-01-15'` (alta directa en `db.timeEntries.add`), reemplazarla cambiando solo `timeValue` ⇒ la nueva fila conserva `date: '2020-01-15'`, el `id` original desaparece, no aparece ninguna fila en `getLocalToday()`, `getDailyBalance('2020-01-15')` refleja el cambio y el balance de hoy queda intacto (quickstart V2)
- [ ] T013 [US2] Add past-date component test to tests/component/EntryList.test.tsx: con una entrada `date: '2020-01-15'`, "Editar" abre el formulario prellenado, modificar duración y "Guardar" ⇒ `onReplace` recibe los valores editados y la fila muestra los datos nuevos (locks que la UI de edición no especializa "hoy", FR-010)

**Checkpoint**: US1 AND US2 both work independently — edición operativa para cualquier día consultado.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T014 [P] Run full verification `npm test` and `npx tsc -b` — all GREEN in tests/, including new replace/EditEntryForm/EntryList suites, no skipped tests
- [ ] T015 [P] Constitution grep audit: no `.update(` / `.put(` added in src/core/time-entry.repo.ts (Artículo IV — solo `get`/`delete`/`add` en `replaceTimeEntry`); no new dependencies in package.json (Artículo VIII); no global store introduced (Artículo VII)
- [ ] T016 [P] UI language audit: "Editar", "Guardar", "Cancelar", mensajes de validación y toasts en español en src/components/EditEntryForm.tsx y src/components/EntryList.tsx (Artículo VI); nombres de código/firmas en inglés
- [ ] T017 Execute scenarios V1–V8 in specs/003-edit-day-entries/quickstart.md end-to-end (automated suites + manual dev steps V7/V8) and record results at the end of that file
- [ ] T018 Red-Green-Refactor final pass: review EditEntryForm vs QuickEntryBar for accidental duplication worth extracting ONLY if trivial and green (Artículo VII — sin abstracciones prematuras); confirm all suites stay GREEN (Artículo III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS both stories**
- **US1 (Phase 3)**: Depends on Phase 2 — independent of US2 (MVP)
- **US2 (Phase 4)**: Depends on US1 (`replaceTimeEntry` + UI de edición); añade cobertura de días pasados
- **Polish (Phase 5)**: Depends on desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — independent (MVP)
- **US2 (P2)**: After US1 (reusa `replaceTimeEntry`, `EditEntryForm`, `EntryList` sin cambios de producción — solo tests)

### Within Each User Story

- Tests MUST fail (RED) before implementation (Artículo III)
- Repo core → hook → component → App wiring

### Parallel Opportunities

- T003 ⇄ T004 (integración vs componente, distintos archivos)
- T007 ⇄ T008 tras T006 (EditEntryForm.tsx vs useTimeEntries.ts)
- T014–T016 en paralelo (verificación + auditorías transversales)

---

## Parallel Example: User Story 1

```bash
# En paralelo (tests en rojo):
Task: "Failing integration tests replaceTimeEntry in tests/integration/time-entry-replace.test.ts"
Task: "Failing component tests EditEntryForm in tests/component/EditEntryForm.test.tsx"

# Tras RED, implementación core:
Task: "Implement replaceTimeEntry in src/core/time-entry.repo.ts"

# En paralelo (distintos archivos):
Task: "Implement EditEntryForm in src/components/EditEntryForm.tsx"
Task: "Add replace() to useTimeEntries in src/hooks/useTimeEntries.ts"

# Luego EntryList y App:
Task: "EntryList edit-flow tests + implementation"
Task: "Wire handleReplace in src/App.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 baseline → Phase 2 foundational
2. Phase 3: edición completa del día en curso (rojo→verde)
3. **STOP and VALIDATE**: quickstart V1/V5/V6 + flujo manual V7 (hoy)
4. Demo: corregir una entrada en <30s (SC-001)

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → validar → edición operativa (MVP!)
3. US2 → validar (V2) → edición de días pasados garantizada
4. Polish → V1–V8 + auditorías constitución

---

## Notes

- [P] tasks = different files, no dependencies
- Tests use fake-indexeddb real — never mock Dexie (Artículo IX); el único patch permitido es el spy puntual de `add` para rollback (T003d, research R-06)
- `replaceTimeEntry` NEVER calls `update`/`put` — solo `delete` + `add` en transacción (Artículo IV, FR-008)
- Commit after each task or logical group (mensajes en inglés, Artículo VI)
- Stop at any checkpoint to validate story independently
