# Implementation Plan: Exportar e Importar Datos (JSON)

**Branch**: `specs/002-json-export-import` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-json-export-import/spec.md`

## Summary

Añadir respaldo local en JSON al Balance Tracker: botones "Exportar datos"
e "Importar datos" en la pantalla principal. Enfoque técnico: funciones
puras de serialización/validación del archivo de respaldo en `src/core`,
operaciones de repositorio de importación atómica sobre Dexie (bulkAdd
filtrando duplicados por id), hooks `useBackup` consumiendo contratos
tipados, y componentes de presentación con file picker nativo. TDD con
Vitest + `fake-indexeddb` antes de la UI.

## Technical Context

**Language/Version**: TypeScript 5.x sobre React 18+ / Vite 6+ (proyecto existente)

**Primary Dependencies**: Dexie.js 4.x (bulkAdd nativo), React; Vitest +
`fake-indexeddb`; sin dependencias nuevas (APIs de archivo nativas:
Blob/URL/ObjectURL/FileReader→File.text())

**Storage**: IndexedDB local vía Dexie — la importación escribe con la
misma instancia `db` del producto; el archivo JSON viaja por descarga y
selector de archivo del navegador

**Testing**: Vitest (unidad pura + integración real fake-indexeddb +
componentes jsdom); Red-Green-Refactor obligatorio (Artículo III)

**Target Platform**: Navegadores modernos (mismo MVP actual), offline

**Project Type**: Web app SPA local-first — feature incremental sobre las
3 capas existentes (core/hooks/components)

**Performance Goals**: importar 1.000 entradas en <5s percibidos; exportar
<1s

**Constraints**: sin edición ni borrado durante importación (Art. IV);
todo-o-nada; UI español / datos EN (Art. VI); sin estado global (Art. VII)

**Scale/Scope**: 1 usuario; ~4 tareas de núcleo + 2 componentes + 1 hook;
formato v1 estable

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Artículo | Estado | Evidencia en el plan |
|---|----------|--------|----------------------|
| I | Library-First | PASS | `backup-file.ts` (serialización/validación pura) y `backup.repo.ts` (orquestación Dexie) en `src/core`; UI solo presenta |
| II | Interfaces tipadas | PASS | Contratos en `contracts/backup-contract.md`: `Promise<ExportResult>`, `Promise<ImportResult { added, skipped }>`, validación estricta |
| III | TDD estricto | PASS | Tests rojos de parser/validación y de importación atómica antes de hooks/UI (verbatim en tasks.md) |
| IV | Gobernanza de datos | PASS | Importación solo ADD de ids nuevos; jamás `update`/`delete`; omite duplicados existentes |
| V | Errores y UI | PASS | Errores de archivo/almacenamiento → códigos de dominio → notificaciones ES amigables; importación atómica ante fallo |
| VI | Convenciones e idioma | PASS | Campos del archivo en EN (`entries`, `category`...); UI "Exportar datos"/"Importar datos"; resúmenes ES |
| VII | 3 capas, sin estado global | PASS | Extiende `src/core`, `src/hooks/useBackup.ts`, `src/components/DataTransferButtons.tsx`; estado local únicamente |
| VIII | Confianza en el framework | PASS | File API nativa, `JSON.parse/stringify`, Dexie `bulkAdd` — sin librerías de serialization ni wrappers |
| IX | Pruebas reales | PASS | Importación probada contra fake-indexeddb real (índice `id`, `bulkAdd`) sin mocks de Dexie |

**Gate result**: PASS (0 violaciones). Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/002-json-export-import/
├── plan.md
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── backup-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root — deltas sobre feature 001)

```text
src/
├── core/
│   ├── backup-file.ts        # Nuevo: tipos BackupFile, parseBackupFile,
│   │                         #   serializeBackupFile (puras)
│   └── backup.repo.ts        # Nuevo: exportAllEntries, importBackupEntries
│                             #   (atómica, filtra duplicados)
├── hooks/
│   └── useBackup.ts          # Nuevo: exportData, importFile, importing,
│                             #   lastImportResult, error
└── components/
    └── DataTransferButtons.tsx  # Nuevo: botones Exportar/Importar + resumen

tests/
├── unit/backup-file.test.ts          # Nuevo: parser/serialización pura
├── integration/backup-import.test.ts # Nuevo: importación atómica real
└── component/DataTransferButtons.test.tsx  # Nuevo
```

**Structure Decision**: feature incremental dentro de las 3 capas
existentes; cero cambios de esquema Dexie (se reutiliza `timeEntries`).

## Complexity Tracking

> No hay violaciones de la constitución que justificar.
