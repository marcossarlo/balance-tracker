# Data Model: Editar Entradas del Día

**Date**: 2026-10-12 | **Plan**: [plan.md](./plan.md)

## Entities

### TimeEntry (tabla `timeEntries`)

Sin cambios de esquema. Campos según la Constitución (sección Technical
Stack & Data Model) y feature 001:

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | `&id` (clave primaria) | Se regenera en cada reemplazo |
| `category` | `'WORK' \| 'LEARNING'` | enum | Editable |
| `description` | String | trimmed, 1–200 | Editable |
| `timeValue` | entero | ∈ {15, 30, 60, 120, 180, 240} | Editable |
| `date` | `YYYY-MM-DD` | índice `date` | **Inmutable** — se preserva de la fila original |
| `timestampCreation` | unix ms | informativo | Se regenera (`Date.now()`) en cada reemplazo |

La edición no muta filas: elimina la fila original y crea una fila nueva
con los campos editables actualizados, la misma `date` y un nuevo
`id`/`timestampCreation` (FR-008, patrón borrar-y-recrear).

### EditTimeEntryInput (entrada de la operación de reemplazo — no persistido)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string | debe corresponder a una fila existente | Identificador de la entrada a reemplazar |
| `category` | `'WORK' \| 'LEARNING'` | enum | Mismas reglas que creación |
| `description` | string | trimmed, 1–200 | Mismas reglas que creación |
| `timeValue` | entero | ∈ catálogo `DURATION_VALUES` | Mismas reglas que creación |

**No incluye `date`** deliberadamente: la fecha la fija el repositorio
desde la fila original (FR-004, research R-02).

## Validation Rules

Reutiliza `assertValidEntryFields` (existente en
`src/core/entry-validation.ts`) — mismas reglas que `createTimeEntry`:
- `category` ∈ {'WORK', 'LEARNING'} si no → `VALIDATION`
- `timeValue` ∈ `DURATION_VALUES` si no → `VALIDATION`
- `description` string recortable de 1..200 chars si no → `VALIDATION`

Reglas adicionales del reemplazo:
- `id` debe existir en `timeEntries`; si no → `VALIDATION`
  (research R-03).

## State Transitions (reemplazo)

```
[formulario abierto] --Guardar--> [validar campos] --get(id)--> [transacción: delete + add] --> [completado: nuevo TimeEntry]
        |                              |                    |                                |
     Cancelar: nada              VALIDATION: nada     add falla: rollback            UI refresca balance
                                   persistido          (fila original intacta)        y tendencias
```

- No existe estado interno intermedio persistido: la transacción de Dexie
  hace que el `delete` y el `add` sean atómicos (todo-o-nada). Si `add`
  falla, el `delete` se revierte y la fila original permanece intacta
  (edge case de fallo parcial del spec, mitigado — research R-01).
- Cancelar no toca la base de datos (FR-007).

## Error Model (sin cambios de dominio)

```ts
RepositoryErrorCode =
  | 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' | 'VALIDATION' | 'UNKNOWN'
  | 'BACKUP_INVALID' | 'BACKUP_TOO_LARGE';
```

El reemplazo utiliza los códigos existentes:
- `VALIDATION`: campos inválidos o `id` inexistente.
- `QUOTA_EXCEEDED` / `DB_UNAVAILABLE` / `UNKNOWN`: propagados por
  `mapIndexedDbError` desde las operaciones Dexie.

No se agregan códigos nuevos (research R-03).
