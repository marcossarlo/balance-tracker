# Research: Exportar e Importar Datos (JSON)

**Date**: 2026-10-10 | **Plan**: [plan.md](./plan.md)

## R-01: Formato del archivo de respaldo

**Decision**: Objeto JSON con envoltorio versionado:
`{ app: 'balance-tracker', version: 1, exportedAt: <unix ms>, entries: TimeEntry[] }`.
Los campos de cada entrada usan los nombres EN del esquema (`id`,
`category`, `description`, `timeValue`, `date`, `timestampCreation`).

**Rationale**: La marca `app`+`version` permite rechazar formatos
desconocidos y evolucionar en el futuro (FR-002). Versionar desde el día
uno es gratis y evita migraciones dolorosas.

**Alternatives**: JSON plano `TimeEntry[]` (rechazado: imposible
distinguir archivos ajenos o de otra versión); JSON con schema externo
JSON-Schema (rechazado: peso innecesario, Artículo VII).

## R-02: Descarga del archivo (export)

**Decision**: `Blob` de texto JSON + `URL.createObjectURL` + enlace
`<a download>` sintético con nombre `balance-tracker-YYYY-MM-DD.json`;
liberación del object URL con `URL.revokeObjectURL` tras el clic.

**Rationale**: API nativa del navegador, cero dependencias (Artículo VIII),
funciona offline.

**Alternatives**: `showSaveFilePicker` (rechazado: soporte desigual entre
navegadores); data URI (rechazado: problemas de tamaño y encoding).

## R-03: Lectura del archivo (import)

**Decision**: `<input type="file" accept="application/json,.json">` →
`file.text()` → `parseBackupFile(text)` (función pura). Sin FileReader.

**Rationale**: `File.text()` es nativo, promesa y simple; el selector
nativo satisface "cancelar selector" sin código extra (el evento change
no dispara nada al cancelar).

**Alternatives**: FileReader (rechazado: API de callbacks más verbosa);
drag-and-drop (rechazado: fuera de alcance MVP).

## R-04: Importación atómica y deduplicación

**Decision**: `importBackupEntries(entries)`:
1) `db.timeEntries.bulkGet(ids)` → set de ids existentes;
2) filtrar entradas cuyo id ya existe (omisión silenciosa);
3) validar cada entrada restante con las MISMAS reglas del repo
   (reutilizar validación existente / constantes `DURATION_VALUES`);
4) si alguna es inválida → abortar todo con `RepositoryError('VALIDATION')`;
5) `db.timeEntries.bulkAdd(nuevas)`; retornar `{ added, skipped }`.
Los pasos 1–4 ocurren antes de cualquier escritura; `bulkAdd` es la única
escritura (atómica por transacción interna de Dexie).

**Rationale**: Satisface FR-004 (omitir duplicados, nunca editar/borrar),
FR-005 (todo-o-nada) y FR-006 (validación equivalente). `bulkAdd`/`bulkGet`
son APIs nativas de Dexie (Artículo VIII) y probables con fake-indexeddb
(Artículo IX).

**Alternatives**: Escribir entrada por entrada (rechazado: parcialidad y
lentitud); transacción explícita `rw(...)` con rollback manual (rechazado:
`bulkAdd` ya es transaccional; menos código); usar put+merge (rechazado:
`put` sería UPDATE implícito — viola Artículo IV).

## R-05: Semántica combinar vs reemplazar

**Decision**: Combinar por id (ya decidido en el spec como default
seguro). No existe ningún camino de reemplazo total en la UI.

**Rationale**: Reemplazo destructivo contradice el Artículo IV (sin
mutación destructiva masiva) y la confianza del usuario en un respaldo
local-first.

**Alternatives**: Reemplazo total con confirmación peligrosa (rechazado
para MVP).

## R-06: Manejo de errores y códigos

**Decision**: Ampliar el dominio con `BACKUP_INVALID` y `BACKUP_TOO_LARGE`
en `RepositoryErrorCode` (máx. 10 MB de texto, informado amigablemente).
El parser puro lanza `RepositoryError('BACKUP_INVALID', ...)` ante JSON
malformado, marca `app` incorrecta o `version` distinta de 1. La UI
traduce códigos a mensajes ES (mismo patrón que QuickEntryBar).

**Rationale**: Artículo V + II: la UI jamás ve crudos; los códigos son el
contrato.

**Alternatives**: Un único `UNKNOWN` (rechazado: pierde la capacidad de
mensajes específicos); excepciones de JS nativas hacia arriba (rechazado:
violación directa del Artículo V).

## R-07: Actualización de vistas tras importar

**Decision**: `useBackup` recibe callbacks `onImported` o el componente
App reutiliza los `refresh()` existentes de `useDailyBalance`,
`useTimeEntries` y `useWeeklyTrends` tras una importación exitosa.

**Rationale**: Satisface FR-007 sin estado global: el estado se deriva de
las consultas (Artículo VII) y se reutiliza el mecanismo de refresh ya
probado en US1/US4.

**Alternatives**: Recargar la página (rechazado: mala UX y fricción con
PWA); store global (prohibido por el Artículo VII).

## R-08: Orden TDD

**Decision**: (1) rojo para `backup-file.ts` (parser/serialización pura),
(2) rojo para `backup.repo.ts` integración (dedupe, atómico, bulkAdd real),
(3) rojo para `DataTransferButtons` (jsdom), luego implementar en ese
orden.

**Rationale**: Artículos III y IX.

**Alternatives**: mockear JSON/Dexie (prohibido por el Artículo IX).

## Resumen de clausura

- **NEEDS CLARIFICATIONS**: 0.
- Riesgos residuales: rendimiento del parse de archivos muy grandes
  (mitigado por límite 10 MB + validación previa a escribir).
