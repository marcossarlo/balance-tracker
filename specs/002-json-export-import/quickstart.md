# Quickstart: Exportar e Importar Datos (JSON)

**Date**: 2026-10-10 | **Plan**: [plan.md](./plan.md)

Guía de validación; sin implementación. Contratos en
[contracts/backup-contract.md](./contracts/backup-contract.md).

## Prerequisitos

- Proyecto feature 001 funcionando (`npm run dev` / `npm test`).

## Comandos

```bash
npm test             # Vitest: unidades + integración + componentes
npm run test:watch   # TDD
npm run dev          # UI para escenarios manuales
```

## Escenarios de validación

### V1 — Serialización pura (unidad)

1. `serializeBackupFile` con entradas conocidas ⇒ JSON con
   `app: 'balance-tracker'`, `version: 1`, `entries` completo.
2. `serializeBackupFile([])` ⇒ JSON válido con `entries: []`.
3. `parseBackupFile` del propio output ⇒ ronda completo idéntico.

### V2 — Parser rechaza archivos inválidos (unidad)

1. Texto no JSON, JSON que no es objeto, `app` incorrecta, `version: 2`,
   `entries` no-array, entrada con `timeValue: 45`, archivo >10 MB ⇒
   `RepositoryError` con `BACKUP_INVALID` o `BACKUP_TOO_LARGE`; sin
   excepciones crudas.

### V3 — Importación atómica y dedupe (integración, BD real)

1. BD con entrada `id: 'a'`; archivo con `id: 'a'`, `'b'`, `'c'` ⇒
   resultado `{ added: 2, skipped: 1 }`; BD final = a, b, c.
2. Archivo con una entrada inválida entre válidas ⇒ error
   `VALIDATION`; BD permanece **exactamente** igual (atómico).
3. Importar dos veces el mismo archivo ⇒ segunda vez
   `{ added: 0, skipped: N }`.

### V4 — Exportación (integración)

1. Con entradas en la BD, `exportAllEntries()` ⇒ string parseable con
   todas las entradas; `exportAllEntries()` con BD vacía ⇒ `entries: []`.

### V5 — UI de botones (componente)

1. Clic "Exportar datos" ⇒ llama `onExport`; en éxito nada rompe.
2. Selección de archivo válido ⇒ llama `onImport(file)`; resumen en
   español visible ("Importadas: N · Omitidas: M").
3. Cancelar el selector ⇒ sin llamadas ni notificaciones.
4. `importing=true` ⇒ botones deshabilitados durante la operación.

### V6 — Flujo end-to-end manual (dev)

1. `npm run dev` con datos de ejemplo → Exportar → verificar descarga
   `balance-tracker-YYYY-MM-DD.json`.
2. Importar el mismo archivo ⇒ resumen "Importadas: 0 · Omitidas: N".
3. Borrar entradas (Eliminar) → Importar de nuevo ⇒ restauradas;
   balance y tendencia refrescados.
4. Importar un archivo de texto normal ⇒ notificación amigable, datos
   intactos.

### V7 — Offline

1. App ya cargada + red desconectada ⇒ exportar e importar operativos.

## Criterios de aceptación

- `npm test` verde con suites nuevas (unidad parser, integración import,
  componente botones).
- Sin `update`/`delete`/`put` añadidos en `src/core` (búsqueda ⇒ 0).
- V1–V7 ejecutados; resultados registrados al final del archivo.

## Results — 2026-10-10

Suite completa: **18 archivos, 88/88 pruebas verdes** (+32 sobre el
baseline de 56). `tsc -b` exit 0. `npm run build` con PWA (sw.js,
11 entries precache).

| Escenario | Estado | Evidencia |
|---|---|---|
| V1 Serialización pura | ✓ PASS | `tests/unit/backup-file.test.ts` (4): app/version/entries, empty `[]`, nombre de archivo, round-trip |
| V2 Parser rechaza inválidos | ✓ PASS | `tests/unit/backup-file-parse.test.ts` (14): no-JSON, no-objeto, app/version/entries incorrectos, timeValue 45, category fuera, descripción >200 y vacía, fecha mal formada, >10 MB ⇒ `BACKUP_INVALID`/`BACKUP_TOO_LARGE` |
| V3 Import atómica + dedupe | ✓ PASS | `tests/integration/backup-import.test.ts` (5): `{added,skipped}` correcto, filas existentes intactas, inválida ⇒ `VALIDATION` + BD sin cambios, re-importar ⇒ `{added:0}`, round-trip export→import |
| V4 Exportación | ✓ PASS | `tests/integration/backup-export.test.ts` (2): todas las entradas, BD vacía ⇒ `entries: []` |
| V5 UI de botones | ✓ PASS | `tests/component/DataTransferButtons.test.tsx` (7): clic exporta, toast fallo ES, deshabilitados busy, selector ⇒ `onImport(file)`, resumen "Importadas: N · Omitidas: M", cancelar ⇒ sin llamadas |
| V6 End-to-end manual (dev) | ⏳ PENDIENTE (usuario) | Descarga + re-import + restauración + archivo inválido en `npm run dev` |
| V7 Offline | ⏳ PENDIENTE (usuario) | DevTools → Offline con app cargada |

Auditorías constitución: 0 `update(`/`delete(`/`put(` en
`src/core/backup*.ts`; 0 dependencias nuevas en package.json; 0 estado
global; UI en español ("Exportar datos", "Importar datos", resumen).
Refactor: validación de campos compartida extraída a
`src/core/entry-validation.ts` (usado por `createTimeEntry` y
`assertValidTimeEntry`), 88/88 en verde.
