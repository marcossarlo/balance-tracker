---

description: "Task list template for feature implementation"
---

# Tasks: Exportar e Importar Datos (JSON)

**Input**: Design documents from `/specs/002-json-export-import/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **REQUIRED** — constitución Art. III (TDD estricto) y Art. IX
(fake-indexeddb real, sin mocks de Dexie). Tests en rojo antes de cada
implementación.

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

- [ ] T001 Run baseline verification: `npm test` and `npx tsc -b` at repository root must be green (56 tests from feature 001) before starting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Constantes/tipos del formato y ampliación de códigos de error que ambas historias necesitan

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Extend RepositoryErrorCode with `'BACKUP_INVALID' | 'BACKUP_TOO_LARGE'` in src/core/errors.ts per data-model.md error model (keep existing codes unchanged)
- [ ] T003 [P] Create BackupFile interface and constants in src/core/backup-file.ts: `BACKUP_APP = 'balance-tracker'`, `BACKUP_VERSION = 1`, `MAX_BACKUP_TEXT_BYTES = 10 * 1024 * 1024`, `BackupFile { app, version, exportedAt, entries: TimeEntry[] }` per contracts/backup-contract.md (types/constants only; functions come in story phases)

**Checkpoint**: Foundation ready — US1 and US2 can begin.

---

## Phase 3: User Story 1 - Exportar todos los datos a JSON (Priority: P1) 🎯 MVP

**Goal**: Botón "Exportar datos" que descarga un JSON versionado con todas las entradas.

**Independent Test**: Pulsar el botón descarga `balance-tracker-YYYY-MM-DD.json` con `app/version/entries` correctos; BD vacía ⇒ `entries: []` válido (quickstart V1/V4).

### Tests for User Story 1 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T004 [P] [US1] Failing unit tests for `serializeBackupFile` and `buildBackupFileName` in tests/unit/backup-file.test.ts: output is valid JSON with `app: 'balance-tracker'`, `version: 1`, `entries` preserving all TimeEntry fields; empty list ⇒ `entries: []`; `buildBackupFileName('2026-10-10')` ⇒ `'balance-tracker-2026-10-10.json'`; round-trip serialize→parse idéntico
- [ ] T005 [P] [US1] Failing integration tests for `exportAllEntries` in tests/integration/backup-export.test.ts (fake-indexeddb real): exports every stored entry across scattered dates; empty DB ⇒ parseable JSON with `entries: []`
- [ ] T006 [US1] Run `npm test` and confirm T004/T005 fail RED in tests/unit/backup-file.test.ts and tests/integration/backup-export.test.ts (Artículo III)

### Implementation for User Story 1

- [ ] T007 [US1] Implement `serializeBackupFile(entries, now?)` and `buildBackupFileName(dateIso)` in src/core/backup-file.ts (pure functions, no IO) — turns T004 GREEN
- [ ] T008 [US1] Implement `exportAllEntries(): Promise<string>` in src/core/backup.repo.ts using native Dexie `toArray()` read + `serializeBackupFile` — turns T005 GREEN
- [ ] T009 [US1] Create `useBackup` hook with `exportData()` in src/hooks/useBackup.ts: `exporting` flag, Blob + `URL.createObjectURL` + synthetic `<a download>` click + `revokeObjectURL` per research.md R-02; resolves `{ ok } | { ok: false, code }`, never rejects; error codes via `toRepositoryErrorCode`
- [ ] T010 [P] [US1] Create DataTransferButtons component in src/components/DataTransferButtons.tsx: "Exportar datos" button (Spanish labels), disabled while exporting, `role="status"` friendly toast on `{ ok: false }` per FR-008
- [ ] T011 [US1] Wire export into src/App.tsx: `useBackup().exportData` passed to DataTransferButtons alongside existing components
- [ ] T012 [US1] Component test in tests/component/DataTransferButtons.test.tsx: export click calls `onExport`; failure shows Spanish `role="status"` toast; button disabled while `exporting=true`

**Checkpoint**: US1 fully functional — user can back up data.

---

## Phase 4: User Story 2 - Importar datos desde JSON (Priority: P2)

**Goal**: Botón "Importar datos" que añade entradas nuevas de un respaldo, omitiendo duplicados, de forma atómica, con resumen en español.

**Independent Test**: Archivo con ids parcialmente existentes ⇒ `{ added, skipped }` correcto; archivo inválido ⇒ 0 escrituras + notificación (quickstart V2/V3/V6).

### Tests for User Story 2 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T013 [P] [US2] Failing unit tests for `parseBackupFile` in tests/unit/backup-file-parse.test.ts: accepts valid file (round-trip); rejects non-JSON text, non-object JSON, wrong `app`, `version: 2`, non-array `entries`, invalid entry (`timeValue: 45`, category fuera de enum, descripción >200, fecha mal formada) with `RepositoryError` code `BACKUP_INVALID`; rejects text >10MB with `BACKUP_TOO_LARGE`; never throws raw JS errors
- [ ] T014 [P] [US2] Failing integration tests for `importBackupEntries` in tests/integration/backup-import.test.ts (fake-indexeddb real, Artículo IX): mixed ids ⇒ `{ added: 2, skipped: 1 }` with only new rows added; existing rows untouched (no update/delete); invalid entry among valid ones ⇒ `VALIDATION` error and DB unchanged (atomic); importing same file twice ⇒ second `{ added: 0, skipped: N }`
- [ ] T015 [US2] Run `npm test` and confirm T013/T014 fail RED in tests/unit/backup-file-parse.test.ts and tests/integration/backup-import.test.ts (Artículo III)

### Implementation for User Story 2

- [ ] T016 [US2] Implement `parseBackupFile(text)` in src/core/backup-file.ts: JSON.parse + validate `app`/`version`/`entries` + per-entry rules reusing `DURATION_VALUES` and `TimeEntry` constraints per data-model.md; size guard `MAX_BACKUP_TEXT_BYTES`; throws only `RepositoryError` — turns T013 GREEN
- [ ] T017 [US2] Implement `importBackupEntries(entries)` in src/core/backup.repo.ts per research.md R-04: `bulkGet` existing ids → filter duplicates (skipped) → validate all remaining (abort whole import on any invalid) → single `bulkAdd` → return `{ added, skipped }`; no `update`/`delete`/`put` anywhere — turns T014 GREEN
- [ ] T018 [US2] Add `importFile(file, onImported?)` to src/hooks/useBackup.ts per contracts/backup-contract.md: `file.text()` → `parseBackupFile` → `importBackupEntries`; `importing` flag; `lastImportResult`; resolves `{ ok, result } | { ok: false, code }`; invokes `onImported` on success only
- [ ] T019 [US2] Extend DataTransferButtons in src/components/DataTransferButtons.tsx: "Importar datos" button + hidden `<input type="file" accept="application/json,.json">`; cancel selector ⇒ no calls; success shows Spanish summary `"Importadas: N · Omitidas: M"` (FR-007); friendly `role="status"` toast on failure (FR-008); both buttons disabled while `importing`
- [ ] T020 [US2] Wire import into src/App.tsx: `importFile(file, () => { refreshBalance(); refreshEntries(); refreshTrends(); })` per research.md R-07 (FR-007 update visible views)
- [ ] T021 [US2] Component test in tests/component/DataTransferButtons.test.tsx: file selection calls `onImport` with the File; summary "Importadas: 5 · Omitidas: 2" rendered; cancel (no change event) ⇒ no calls; failure shows friendly toast and no summary

**Checkpoint**: US1 AND US2 both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T022 [P] Run full test suite `npm test` — all GREEN in tests/, including new backup suites, no skipped tests
- [ ] T023 [P] Grep audit: no `update(`/`delete(`/`put(` added in src/core/backup*.ts (Artículo IV), no new dependencies in package.json (Artículo VIII), no global store (Artículo VII)
- [ ] T024 [P] UI language audit: "Exportar datos", "Importar datos", summary and toasts in Spanish in src/components/DataTransferButtons.tsx (Artículo VI)
- [ ] T025 Execute scenarios V1–V7 in specs/002-json-export-import/quickstart.md end-to-end (automated + manual dev steps) and record results at the end of that file
- [ ] T026 Red-Green-Refactor final pass: extract any duplication between backup-file/backup.repo and existing core helpers keeping all tests green (Artículo III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS both stories**
- **US1 (Phase 3)**: Depends on Phase 2 — independent of US2
- **US2 (Phase 4)**: Depends on Phase 2; reuses `useBackup`/UI shell de US1 (añade `importFile` y el input)
- **Polish (Phase 5)**: Depends on desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — independent (MVP)
- **US2 (P2)**: After Foundational; ideally after US1 (comparte `useBackup` y `DataTransferButtons`)

### Within Each User Story

- Tests MUST fail (RED) before implementation (Artículo III)
- Pure core → repository → hook → component → App wiring

### Parallel Opportunities

- T004 ⇄ T005 (unit vs integration, distintos archivos)
- T013 ⇄ T014
- T010 [P] (componente) cuando el hook esté listo
- T022–T024 en paralelo (auditorías transversales)

---

## Parallel Example: User Story 2

```bash
# En paralelo (tests en rojo):
Task: "Failing unit tests parseBackupFile in tests/unit/backup-file-parse.test.ts"
Task: "Failing integration tests importBackupEntries in tests/integration/backup-import.test.ts"

# Tras RED, implementación core:
Task: "Implement parseBackupFile in src/core/backup-file.ts"
Task: "Implement importBackupEntries in src/core/backup.repo.ts"

# Luego hook y UI:
Task: "importFile in src/hooks/useBackup.ts"
Task: "DataTransferButtons import UI in src/components/DataTransferButtons.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 baseline → Phase 2 foundational
2. Phase 3: exportación completa (rojo→verde)
3. **STOP and VALIDATE**: quickstart V1/V4 + descarga manual
4. Demo: backup de datos

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → validar → backup operativo
3. US2 → validar (V2/V3/V6) → restauración completa
4. Polish → V1–V7 + auditorías constitución

---

## Notes

- [P] tasks = different files, no dependencies
- Tests use fake-indexeddb real — never mock Dexie (Artículo IX)
- Import NEVER deletes or edits existing rows (Artículo IV; FR-004)
- Commit after each task or logical group (mensajes en inglés, Artículo VI)
- Stop at any checkpoint to validate story independently
