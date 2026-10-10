# Data Model: Balance Tracker MVP

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md)

## Entities

### TimeEntry (tabla `timeEntries` en Dexie)

Representa una cantidad de tiempo dedicada a una categoría en un día
calendario. Es la única entidad persistente del producto.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `string` (UUID v4) | PK, inmutable | Generado en creación; nunca cambia |
| `category` | `'WORK' \| 'LEARNING'` | required, enum | UI: "Trabajo" / "Aprendizaje" |
| `description` | `string` | required, trimmed, 1–200 chars | Texto libre en español |
| `timeValue` | `DurationValue` | required, ∈ {15, 30, 60, 120, 180, 240} | Minutos; catálogo fijo |
| `date` | `string` | required, `YYYY-MM-DD`, **índice `&date`** | Día calendario local al crear |
| `timestampCreation` | `number` | required, unix ms | Solo informativo; no indexado en v1 |

**Índices Dexie (v1)**: `&id` (PK), `&date` (único NO — un día tiene
muchas entradas → índice no-único `date`), `[date+category]` opcional.

### Derived (no persistidos)

| Shape | Origin | Consumers |
|---|---|---|
| `DailyBalance { work, learning, total }` | `computeDailyBalance()` | `SplitDashboard` |
| `WeeklyTrendPoint { date, label, work, learning }[]` (7 elementos) | `computeWeeklyTrends()` | `WeeklyTrends` |

## Validation Rules (repositorio, antes de `add`)

- `category` ∈ `{ WORK, LEARNING }` → si no, `ValidationError`.
- `timeValue` ∈ catálogo → si no, `ValidationError` (ej. rechaza 45).
- `description` no vacía tras trim, ≤ 200 caracteres.
- `date` con formato `YYYY-MM-DD` estricto.
- DELETE: si `id` no existe, resolver sin error (idempotente).

## State Transitions

```
[no existe] --createTimeEntry--> [existe]
[existe]    --deleteTimeEntry-->  [no existe]
```

- No hay transición de edición (Artículo IV): UPDATE inexistente por diseño.
- Crear y eliminar son operaciones independientes por entrada; no hay
  estados intermedios expuestos (guardar es atómico: o se persiste todo o
  nada y se notifica error).

## Query Patterns

| Query | Uso | Índice |
|---|---|---|
| `where('date').equals(day)` | Balance diario | `date` |
| `where('date').between(startDay, endDay, inclusive)` | Tendencia 7 días | `date` |
| `orderBy('date').reverse()` | Lista del día/recientes | `date` |
| `delete(id)` | Corrección de errores | PK |

## Error Model (dominio)

```ts
RepositoryError {
  code: 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' | 'VALIDATION' | 'UNKNOWN'
  message: string   // interno, en inglés
}
// UI traduce code → mensaje amigable en español; jamás muestra `message` crudo.
```
