# Research: Editar Entradas del Día

**Date**: 2026-10-12 | **Plan**: [plan.md](./plan.md)

## R-01: Mecanismo de persistencia del reemplazo

**Decision**: Nueva función `replaceTimeEntry(input: EditTimeEntryInput):
Promise<TimeEntry>` en `src/core/time-entry.repo.ts` que:
1) valida los campos con `assertValidEntryFields` (reutilización);
2) carga la entrada original con `db.timeEntries.get(input.id)` — si no
existe → `RepositoryError('VALIDATION')`;
3) ejecuta `db.transaction('rw', db.timeEntries, async () => { delete(id);
add(nuevo) })` donde el registro nuevo preserva la `date` original y recibe
nuevo UUID y nuevo `timestampCreation`;
4) retorna el `TimeEntry` persistido.

**Rationale**: Satisface FR-008 (patrón borrar-y-recrear, cero `update`/
`put` — Artículo IV), FR-004 (la fecha se toma de la fila original dentro
del repositorio, no de la UI) y el edge case de fallo parcial del spec: la
transacción nativa de Dexie garantiza rollback completo (o se borra y crea
junto, o no pasa nada), que es la mitigación más fuerte posible — más allá
del "consecutivo e inmediato" mínimo del spec. `transaction`/`get`/`delete`/
`add` son APIs nativas de Dexie (Artículo VIII).

**Alternatives**:
- `delete` + `add` secuenciales sin transacción (rechazado: si `add` falla
  tras `delete`, se pierde el registro original — el edge case del spec queda
  mal mitigado).
- `db.timeEntries.put()` con el mismo `id` (rechazado: es semántica UPDATE,
  viola Artículo IV y FR-008; además conservaría `id`/`timestampCreation`,
  contradiciendo el spec).
- `bulkPut`/`bulkDelete` (rechazado: mismos problemas de semántica UPDATE;
  operación de a-to-uno no necesita bulk).

## R-02: Origen de la fecha preservada

**Decision**: La `date` del registro nuevo se lee de la fila original
dentro de `replaceTimeEntry`; la UI nunca envía ni transforma la fecha.
`EditTimeEntryInput` solo contiene `id`, `category`, `description`,
`timeValue`.

**Rationale**: Refuerza FR-004 en la capa correcta (datos, no presentación)
y los Artículos I y II: la UI consume contratos limitados y no adivina ni
normaliza datos. Un cambio malicioso o accidental en la UI no puede mover
una entrada de día.

**Alternatives**:
- Que la UI pase la fecha junto con los campos (rechazado: expone un
  parámetro que el spec prohíbe modificar y traslada una garantía de
  integridad a la capa de presentación).
- Recrear con `getLocalToday()` (rechazado: movería entradas de días
  pasados al día actual — viola FR-004 y US2).

## R-03: Código de error para entrada inexistente

**Decision**: Reutilizar `VALIDATION` (ya presente en
`RepositoryErrorCode`) cuando `get(id)` no retorne fila. La UI de edición
mapea `VALIDATION` a un mensaje específico de contexto ("No se pudo editar:
la entrada ya no existe o los datos son inválidos.").

**Rationale**: Artículo VII (anti-sobreingeniería): un nuevo código
`NOT_FOUND` expandiría el dominio de errores y obligaría a actualizar
todos los mapas `ERROR_MESSAGES` de la UI (EntryList, QuickEntryBar,
DataTransferButtons) por un caso marginal. `VALIDATION` ya significa
"datos inválidos" y encaja semánticamente: el `id` no corresponde a una
entrada existente.

**Alternatives**:
- Nuevo código `NOT_FOUND` (rechazado: expansión del dominio + 3 mapas de
  UI a actualizar para ganancia marginal; Artículo VII).

## R-04: Forma del formulario de edición (UI)

**Decision**: Nuevo componente presentacional `src/components/EditEntryForm.tsx`
renderizado inline dentro del `<li>` de la fila en edición (estado local
`editingId` en `EntryList`). Reproduce la estructura de campos de
`QuickEntryBar` (botones de categoría Trabajo/Aprendizaje, input de
descripción `maxLength=200`, botones del catálogo de duraciones) con los
valores de la entrada prellenados, más botones "Guardar" y "Cancelar".
Pre-validación de presentación idéntica a la de `QuickEntryBar` (categoría,
descripción no vacía, duración) antes de llamar a `onReplace`; ante error
del repositorio muestra toast ES y mantiene el formulario abierto.

**Rationale**: Satisface FR-002/003/006/007 y el edge case de descripción
vacía, siguiendo el patrón ya probado y aceptado en el proyecto (Artículo
VIII: confianza en las convenciones existentes). `editingId` es estado
local de presentación, no estado de negocio (Artículo VII lo permite).
Componente separado (vs. mutar `QuickEntryBar`) eviona regresiones en el
flujo de creación ya testeado y mantiene ambos componentes simples.

**Alternatives**:
- Reusar `QuickEntryBar` con props opcionales `initialValues`/`submitLabel`/
  `onCancel` (rechazado: convierte un componente simple en componente
  mixto con conditionales; riesgo de regresión en el flujo create ya
  cubierto por pruebas; Artículo VII).
- Modal/dialog overlay (rechazado: introduce un patrón de UI nuevo e
  innecesario; el diseño de la app es plano/inline y un formulario dentro
  de la fila es coherente con `EntryList`).
- Extraer un subcomponente compartido `EntryFields` usado por
  `QuickEntryBar` y `EditEntryForm` (rechazado para esta feature: nueva
  abstracción + refactor de código estable sin necesidad funcional —
  Artículo VII. Se puede reconsiderar si aparece un tercer formulario).

## R-05: Cableado del hook y de App

**Decision**: Ampliar `useTimeEntries` con
`replace(input: EditTimeEntryInput): Promise<SaveResult>` siguiendo el
patrón exacto de `save`/`remove` (try repo → `refresh()` → resultado tipado
`{ ok: true; entry } | { ok: false, code }`; catch →
`toRepositoryErrorCode`). En `App.tsx`, nuevo `handleReplace` análogo a
`handleRemove`: llama `replace` y, en éxito, `refreshAll()` (balance +
tendencias). Se pasa a `EntryList` como prop `onReplace`.

**Rationale**: FR-005 exige que balance diario y tendencias semanales
reflejen el cambio tras guardar; el mecanismo `refresh()` ya existe y está
probado (patrón de la feature 002, R-07). Reutilizar `SaveResult` evita
definir un tipo nuevo idéntico (Artículo VII).

**Alternatives**:
- Hook nuevo `useEntryEdit` separado (rechazado: duplicaría el estado de
  lista/refresh sin ganancia; Artículo VII).
- Recargar la página (rechazado: mala UX, rompe PWA).
- Store global para sincronizar vistas (rechazado: prohibido por Artículo
  VII).

## R-06: Orden de TDD y prueba de rollback

**Decision**: (1) rojo para `tests/integration/time-entry-replace.test.ts`
(fake-indexeddb real): caso exitoso (nuevo id, fecha preservada, campos
actualizados, fila original eliminada, solo una fila por el `id` de fecha),
validación (categoría/duración/descripción inválidas → `VALIDATION` sin
cambios en BD), id inexistente → `VALIDATION`, descripción con espacios →
trim; (2) rojo para `tests/component/EditEntryForm.test.tsx` (jsdom):
prellenado, cancelar sin llamadas, guardar llama `onReplace` con valores,
mensaje de validación con descripción vacía, toast + formulario abierto en
error, "Guardar" deshabilitado durante la operación; (3) rojo para los
nuevos casos de `tests/component/EntryList.test.tsx`: botón "Editar" abre
el formulario de esa fila, un solo formulario a la vez, guardado exitoso
cierra el formulario y muestra los datos nuevos, cancelar restaura la fila.
Rollback de transacción: un único caso que parchea puntualmente
`db.timeEntries.add` para lanzar una vez (spy de vitest) y verifica que la
fila original permanece intacta (transacción revirtió el `delete`).

**Rationale**: Artículos III y IX. El patch de `add` es una excepción
única y documentada, no "excesivo" (solo se fuerza un fallo interno
imposible de provocar con datos, precisamente para probar la garantía de
atomicidad que protege el edge case del spec).

**Alternatives**:
- No probar rollback y confiar en la semántica de transacciones de Dexie
  (rechazado: el edge case de pérdida parcial es crítico para la confianza
  del usuario y merece una prueba directa).
- Usar un hook de nivel inferior de fake-indexeddb para abortar la
  transacción (rechazado: más frágil y acoplado al mecanismo del fake que
  un spy puntual).

## R-07: Orden de las entradas tras el reemplazo

**Decision**: Sin cambios. `listEntriesByDate` retorna en orden natural de
la tabla (clave primaria UUID — efectivamente aleatorio). El spec no exige
orden; la UI actual ya muestra ese orden. El registro recreado se ubicará
donde su nuevo UUID lo ubique, igual que cualquier creación nueva.

**Rationale**: Artículo VII — no se agrega sorteo ni índice nuevo sin un
requisito que lo pida.

**Alternatives**:
- Ordenar por `timestampCreation` (rechazado: cambiaría el orden visible de
  la lista existente — scope creep sin requerimiento).

## R-08: Protección contra doble envío

**Decision**: Estado local `saving` en `EditEntryForm`; "Guardar" queda
deshabilitado mientras la promesa `onReplace` está en vuelo.

**Rationale**: Un doble clic podría disparar dos reemplazos; el segundo
fallaría con `VALIDATION` (id ya eliminado) mostrando un toast de error
confuso. Deshabilitar el botón es la mitigación más simple (mismo patrón
de `DataTransferButtons` con `exporting`/`importing`).

**Alternatives**:
- Sin protección (rechazado: UX confusa ante el segundo intento).

## Resumen de clausura

- **NEEDS CLARIFICATIONS**: 0.
- Riesgos residuales: parche puntual de `add` para la prueba de rollback
  (mitigado: un solo caso, spy restaurado en `afterEach`, documentado como
  excepción en R-06).
