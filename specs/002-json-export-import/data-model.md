# Data Model: Exportar e Importar Datos (JSON)

**Date**: 2026-10-10 | **Plan**: [plan.md](./plan.md)

## Entities

### BackupFile (archivo de respaldo — no persistido en BD)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `app` | `'balance-tracker'` | literal fijo | Rechaza archivos ajenos |
| `version` | `1` | entero, solo se acepta `1` | Evolución futura del formato |
| `exportedAt` | `number` | unix ms | Informativo |
| `entries` | `TimeEntry[]` | cada entrada con reglas del producto | Se importan solo las nuevas |

Cada `TimeEntry` del archivo respeta el modelo de la feature 001:
`id` (UUID), `category` (`'WORK' \| 'LEARNING'`), `description` (trimmed
1–200), `timeValue` (∈ catálogo), `date` (`YYYY-MM-DD`),
`timestampCreation` (unix ms).

### TimeEntry (tabla `timeEntries`)

Sin cambios de esquema. La importación solo **añade** filas cuyo `id` no
existe; nunca modifica ni borra (Artículo IV).

## Validation Rules

**Parser (`parseBackupFile`)** — falla ⇒ `BACKUP_INVALID`, nada importado:
- Texto es JSON válido de un objeto (no array ni primitivo).
- `app === 'balance-tracker'` y `version === 1`.
- `entries` es array; cada elemento cumple las reglas de `TimeEntry`
  (mismas constantes y reglas que `createTimeEntry`).
- Tamaño del texto ≤ 10 MB ⇒ si no, `BACKUP_TOO_LARGE`.

**Importación (`importBackupEntries`)** — éxito ⇒ `{ added, skipped }`:
- `skipped` = entradas cuyo `id` ya existe en BD (sin escribir).
- Entradas nuevas pasan por validación completa; cualquier inválida aborta
  la operación entera (atómico).
- Escritura única con `bulkAdd` de las entradas nuevas.

## State Transitions (importación)

```
[archivo elegido] --lectura--> [parse OK] --dedupe--> [validar] --bulkAdd--> [completado {added,skipped}]
        |                           |                    |
     (cancelado: nada)        BACKUP_INVALID      VALIDATION: nada persistido
                                   |
                            BACKUP_TOO_LARGE
```

- No hay estado intermedio persistido: o se añaden todas las nuevas o
  ninguna.
- La exportación no tiene transiciones: solo lectura de la BD completa.

## Error Model (ampliación)

```ts
RepositoryErrorCode =
  | 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' | 'VALIDATION' | 'UNKNOWN'
  | 'BACKUP_INVALID' | 'BACKUP_TOO_LARGE';   // nuevos en esta feature
```
