# Implementation Plan: Editar Entradas del Día

**Branch**: `003-edit-day-entries` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-edit-day-entries/spec.md`

## Summary

Añadir un botón "Editar" a cada entrada de la lista del día, con formulario
inline prellenado (categoría, descripción, duración) y cancelación limpia.
Enfoque técnico: nueva función de repositorio `replaceTimeEntry` en
`src/core/time-entry.repo.ts` que implementa el patrón borrar-y-recrear
elegido en el spec (FR-008) mediante transacción nativa de Dexie
(`delete` + `add`, jamás `update`/`put`), preservando la fecha original y
generando nuevo `id` y `timestampCreation`; hook `useTimeEntries` ampliado
con `replace()`; nuevo componente presentacional `EditEntryForm` renderizado
inline en `EntryList`; `App` orquesta el refresh de balance y tendencias tras
un reemplazo exitoso. TDD con Vitest + `fake-indexeddb` antes de la UI.

## Technical Context

**Language/Version**: TypeScript 5.x sobre React 18+ / Vite 6+ (proyecto existente)

**Primary Dependencies**: Dexie.js 4.x (API nativa `transaction('rw', ...)`,
`get`/`delete`/`add`), React; Vitest + `fake-indexeddb` + jsdom/RTL; sin
dependencias nuevas

**Storage**: IndexedDB local vía Dexie — misma instancia `db` del producto;
la edición escribe con `delete` + `add` dentro de una transacción

**Testing**: Vitest (integración real fake-indexeddb + componentes jsdom);
Red-Green-Refactor obligatorio (Artículo III)

**Target Platform**: Navegadores modernos (MVP actual), offline

**Project Type**: Web app SPA local-first — feature incremental sobre las
3 capas existentes (core/hooks/components)

**Performance Goals**: operación de reemplazo < 100 ms percibidos (dos
operaciones sobre filas individuales); feedback inmediato en la UI

**Constraints**: sin operaciones `update`/`put` (Artículo IV + FR-008);
fecha de la entrada inmutable (FR-004); UI español / código e datos EN
(Artículo VI); sin estado global — solo estado local de presentación
(Artículo VII); mensajes de error amigables, nunca crudos (Artículo V)

**Scale/Scope**: 1 usuario; ~1 función de repositorio + 1 método de hook +
1 componente nuevo + deltas en `EntryList`/`App`; 3 archivos de pruebas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Artículo | Estado | Evidencia en el plan |
|---|----------|--------|----------------------|
| I | Library-First | PASS | `replaceTimeEntry` en `src/core/time-entry.repo.ts` (lógica de persistencia); `EditEntryForm`/`EntryList` son presentación pura que consumen contratos tipados |
| II | Interfaces tipadas | PASS | Contrato en `contracts/edit-entry-contract.md`: `EditTimeEntryInput`, `replace(input) → Promise<SaveResult>` (reutiliza `SaveResult` existente); la UI recibe el `TimeEntry` nuevo sin transformar nada |
| III | TDD estricto | PASS | Tests rojos de integración (`time-entry-replace.test.ts`) y componentes (`EditEntryForm`, `EntryList`) antes de implementar, en ese orden (verbatim en tasks.md) |
| IV | Gobernanza de datos | PASS | `replaceTimeEntry` solo ejecuta `delete(id)` + `add(nuevo)` en transacción Dexie; cero llamadas a `update`/`put` en `src/core`. El formulario de edición de la UI es una comodidad de presentación que compone operaciones ya permitidas — resolución explícita del usuario en FR-008 (opción B), sin enmienda constitucional |
| V | Errores y UI | PASS | Reutiliza `RepositoryError`/`mapIndexedDbError`; entrada inexistente o inválida → `VALIDATION`; `EditEntryForm` traduce códigos a mensajes ES amigables; ante error el formulario permanece abierto y los datos originales intactos (rollback de la transacción) |
| VI | Convenciones e idioma | PASS | Código/firmas EN (`replaceTimeEntry`, `EditTimeEntryInput`, `EditEntryForm`); UI ES ("Editar", "Guardar", "Cancelar", "Trabajo"/"Aprendizaje") |
| VII | 3 capas, sin estado global | PASS | Deltas en las 3 capas existentes: `time-entry.repo.ts` (datos), `useTimeEntries` (integración), `EditEntryForm`/`EntryList`/`App` (presentación). `editingId`/`saving` son estado local de componente, no global |
| VIII | Confianza en el framework | PASS | Dexie nativo: `db.transaction('rw', ...)`, `get`, `delete`, `add` — sin wrappers ni adaptadores (Artículo VIII) |
| IX | Pruebas reales | PASS | Reemplazo probado contra fake-indexeddb real (índice `date`, transacción); un único y puntual patch de `add` para probar rollback de transacción, documentado en research (umbral de "excesivo" no alcanzado) |

**Gate result**: PASS (0 violaciones). Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/003-edit-day-entries/
├── plan.md
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── edit-entry-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root — deltas sobre el estado actual)

```text
src/
├── core/
│   └── time-entry.repo.ts        # Ampliado: EditTimeEntryInput, replaceTimeEntry
├── hooks/
│   └── useTimeEntries.ts         # Ampliado: replace() (mismo patrón que save/remove)
└── components/
    ├── EntryList.tsx             # Ampliado: botón "Editar" por fila + editingId + onReplace
    ├── EditEntryForm.tsx         # Nuevo: formulario inline prellenado (Guardar/Cancelar)
    └── App.tsx                   # Ampliado: handleReplace + refresh de balance/tendencias

tests/
├── integration/
│   └── time-entry-replace.test.ts   # Nuevo: reemplazo real (fake-indexeddb)
└── component/
    ├── EditEntryForm.test.tsx       # Nuevo: formulario (jsdom)
    └── EntryList.test.tsx           # Ampliado: flujos Editar
```

**Structure Decision**: feature incremental dentro de las 3 capas
existentes; cero cambios de esquema Dexie (la tabla `timeEntries` y sus
índices se reutilizan tal cual — la fecha se preserva al recrear la fila).

## Complexity Tracking

> No hay violaciones de la constitución que justificar.
