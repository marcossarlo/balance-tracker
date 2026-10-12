# Quickstart: Editar Entradas del Día

**Date**: 2026-10-12 | **Plan**: [plan.md](./plan.md)

Guía de validación; sin implementación. Contratos en
[contracts/edit-entry-contract.md](./contracts/edit-entry-contract.md).

## Prerequisitos

- Proyecto base funcionando (`npm run dev` / `npm test`).

## Comandos

```bash
npm test             # Vitest: integración + componentes
npm run test:watch   # TDD
npm run dev          # UI para escenarios manuales
```

## Escenarios de validación

### V1 — Reemplazo exitoso (integración, BD real)

1. Crear entrada `WORK 60min 'Descripción A'` en una fecha `D`; ejecutar
   `replaceTimeEntry` con `id` de esa entrada y datos
   `LEARNING 120min 'Descripción B'` ⇒ retorna `TimeEntry` con:
   - `id` distinto al original (UUID nuevo),
   - `date === D` (fecha preservada),
   - campos actualizados y descripción recortada (trim),
   - `timestampCreation` nuevo (>= anterior).
2. Verificar en BD: exactamente **una** fila para la fecha `D` con los
   datos nuevos; la fila con el `id` original ya no existe.
3. `getDailyBalance(D)` refleja la nueva categoría y duración (el tiempo
   se movió de WORK a LEARNING).

### V2 — Reemplazo preserva fecha de días pasados (integración)

1. Insertar entrada con `date: '2020-01-15'` (día pasado).
2. `replaceTimeEntry` modificando solo `timeValue` ⇒ la nueva fila conserva
   `date: '2020-01-15'`; no aparece en el día de hoy.

### V3 — Validación e id inexistente (integración)

1. `replaceTimeEntry` con `category: 'OTHER'`, `timeValue: 45`, o
   `description: ''` ⇒ `RepositoryError('VALIDATION')`; BD intacta.
2. `replaceTimeEntry` con `id: 'no-existe'` ⇒ `RepositoryError('VALIDATION')`;
   BD intacta.

### V4 — Rollback atómico ante fallo de creación (integración)

1. Parchar puntualmente `db.timeEntries.add` para lanzar una vez; ejecutar
   `replaceTimeEntry` sobre una entrada válida ⇒ lanza error mapeado
   (`UNKNOWN` o `DB_UNAVAILABLE`).
2. Verificar que la **fila original permanece intacta** (transacción revirtió
   el delete); no queda ninguna fila huérfana.
3. Restaurar el parche (spy) y verificar que el siguiente reemplazo funciona.

### V5 — Formulario de edición (componente)

1. Renderizar `EditEntryForm` con una entrada ⇒ categoría, descripción y
   duración aparecen prellenados.
2. Modificar descripción y clic "Guardar" ⇒ `onReplace` recibe
   `{ id, category, description, timeValue }` con los valores visibles.
3. Descripción vacía + "Guardar" ⇒ mensaje de validación ES; `onReplace`
   no se llama; formulario permanece abierto.
4. Clic "Cancelar" ⇒ `onCancel` se invoca; `onReplace` no se llama.
5. `onReplace` resuelve `{ ok: false, code: 'UNKNOWN' }` ⇒ toast ES
   ("No se pudo editar…"); formulario permanece abierto con los datos.
6. "Guardar" presionado ⇒ botón deshabilitado mientras la promesa está en
   vuelo (sin doble envío).

### V6 — Lista con edición inline (componente)

1. Clic "Editar" en una fila ⇒ se reemplaza por el formulario prellenado
   de ESA fila; el resto de filas queda normal.
2. Clic "Editar" en otra fila mientras una ya está en edición ⇒ solo un
   formulario visible a la vez.
3. Guardado exitoso (`onReplace` ⇒ ok) ⇒ formulario se cierra; la fila
   muestra los datos nuevos.
4. Cancelar ⇒ formulario se cierra; la fila muestra los datos originales.
5. Lista en `loading` ⇒ sin botón "Editar" visible.

### V7 — Flujo end-to-end manual (dev)

1. `npm run dev` con datos de ejemplo → clic "Editar" en una entrada →
   cambiar duración → "Guardar" ⇒ lista y balance diario actualizados al
   instante; tendencia semanal refleja el cambio.
2. Seleccionar un día pasado en el selector → editar una entrada de ese
   día → guardar ⇒ permanece en su fecha original.
3. Editar → "Cancelar" ⇒ nada cambia.
4. Editar con descripción vacía → guardar ⇒ validación, formulario abierto.
5. Editar y guardar dos veces seguidas ⇒ cada guardado produce un registro
   visible con los últimos datos; sin duplicados fantasma (la fila anterior
   fue reemplazada).

### V8 — Offline

1. App ya cargada + red desconectada ⇒ editar y guardar operativo.

## Criterios de aceptación

- `npm test` verde con suites nuevas (integración replace, componente
  formulario, lista).
- Búsqueda en `src/core` de `.update(` / `.put(` ⇒ 0 ocurrencias nuevas;
  el reemplazo usa únicamente `delete` + `add`.
- V1–V8 ejecutados; resultados registrados al final del archivo.
