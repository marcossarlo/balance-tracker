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
