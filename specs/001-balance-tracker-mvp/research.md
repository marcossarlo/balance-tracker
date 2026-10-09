# Research: Balance Tracker MVP

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md)

Objeto: resolver toda decisión técnica abierta del Technical Context antes
del diseño. Formato por decisión: **Decision / Rationale / Alternatives**.

## R-01: Esquema Dexie e índice principal

**Decision**: Tabla única `timeEntries` con clave primaria `id` (UUID
string) e índice por `date` (`&date`) más índice secundario opcional
`[date+category]` para agregaciones por día/categoría. Esquema declarado en
`src/core/db.ts` con `version(1).stores({...})`.

**Rationale**: Todas las consultas del producto son por rango de días
(balance diario, semana de 7 días). El índice `&date` (Artículo IX exige
probarlo en real) convierte esas consultas en rangos indexados, no en
table scans. `[date+category]` agiliza los agregados sin imponer nada.

**Alternatives**: Índice por `timestampCreation` (rechazado: el producto
consulta por día calendario, no por instante); tablas separadas por
categoría (rechazado: rompe la entidad única y complica DELETE).

## R-02: Modelo de agregación diaria

**Decision**: Función pura `computeDailyBalance(entries: TimeEntry[]):
DailyBalance` que filtra por `date` y suma `timeValue` por `category`,
retornando `{ work: number, learning: number, total: number }` en minutos.
El repositorio expone una variante `getDailyBalance(date): Promise<DailyBalance>`
que consulta solo el rango del día y delega el cálculo en la función pura.

**Rationale**: Satisface Artículos I y II (lógica pura, salida agregada
pre-calculada; la UI nunca suma). Testeable sin BD (unidad) y con BD
(integración).

**Alternatives**: Agregación con `Collection.sum()` nativo de Dexie
(rechazado como única vía: no es testeable como función pura y diluye el
Artículo I; se conserva la consulta por índice y la suma es trivial sobre
poquísimos registros del día).

## R-03: Transformación de series para Recharts

**Decision**: Función pura `computeWeeklyTrends(entries: TimeEntry[],
weekDates: string[]): WeeklyTrendPoint[]` donde cada punto es
`{ date: 'YYYY-MM-DD', label: 'dd/mm', work: number, learning: number }`
con los 7 días siempre presentes (cero incluido). Recharts consume el array
directamente (`dataKey="work"` / `dataKey="learning"`).

**Rationale**: Artículo II prohíbe que la UI transforme datos en render;
los 7 puntos fijos satisfacen FR-005 y el caso de días vacíos.

**Alternatives**: Construir el array dentro del componente con `map`
(rechazado: viola Artículos I/II); wrapper de charts (rechazado: viola
Artículo VIII).

## R-04: Fechas y zona horaria

**Decision**: `date` se guarda como string local `YYYY-MM-DD` calculado
con `Intl.DateTimeFormat('en-CA')` (o equivalente) al momento de crear la
entrada. La fecha es el día calendario local del dispositivo (asunción del
spec). No se almacena offset horario.

**Rationale**: String ISO plano hace el índice de Dexie ordenable y las
comparaciones de rango trivialmente correctas; usa API nativa sin librería
de fechas (Artículo VIII).

**Alternatives**: Unix timestamp como clave de día (rechazado: requiere
conversión zona horaria en cada consulta y propone errores alrededor de
medianoche); librería `date-fns`/`dayjs` (rechazado: gasto innecesario
para `YYYY-MM-DD` y rangos de 7 días).

## R-05: Estrategia offline / PWA

**Decision**: `vite-plugin-pwa` en modo **autoUpdate** con `registerType:
'autoUpdate'`, precache de la shell (HTML/CSS/JS/manifest) via Workbox
`globPatterns`. La persistencia es IndexedDB local: no hay red de datos en
absoluto, por lo que offline = comportamiento idéntico.

**Rationale**: Satisface US5/FR-010 con la menor superficie posible;
Workbox viene empaquetado en el plugin (no se escribe service worker a mano
— Artículo VIII).

**Alternatives**: Service worker escrito a mano (rechazado: más código y
fallos fáciles); estrategia network-first (rechazado: innecesario sin API
remota).

## R-06: Manejo de errores de IndexedDB

**Decision**: El repositorio atrapa excepciones (`QuotaExceededError`,
`AbortError`, `InvalidStateError`, bloqueos) y las envuelve en un error de
dominio `RepositoryError { code: 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' |
'UNKNOWN', message }`. Los hooks traducen `code` a un mensaje en español;
la UI jamás recibe stack traces. `QuickEntryBar` se resetea solo en éxito;
en error dispara notificación discreta (toast no bloqueante).

**Rationale**: Artículo V. El código de dominio evita comparar mensajes de
texto del navegador y mantiene el contrato tipado (Artículo II).

**Alternatives**: Propagar errores crudos a componentes (rechazado:
violación directa del Artículo V); reintentos automáticos complejos
(rechazado: anti-sobreingeniería, Artículo VII).

## R-07: Orden TDD y estructura de pruebas

**Decision**: Orden obligatorio: (1) rojo para `daily-balance.ts` y
`weekly-trends.ts` (unidades puras), (2) rojo para `time-entry.repo.ts`
contra `fake-indexeddb` (integración, incluye prueba del índice `date` con
rango), (3) recién entonces hooks y componentes. Config de Vitest en
`vite.config.ts`; setup global que inicializa `fake-indexeddb/auto` y
crea una BD fresca por suite.

**Rationale**: Artículos III y IX. `fake-indexeddb` provee implementación
real de IDB en memoria: Dexie corre sin mocks y el índice se valida de
verdad.

**Alternatives**: `vi.mock` de Dexie (prohibido por el Artículo IX);
tests solo de componentes (rechazado: no cubren la lógica de negocio).

## R-08: Estado de React y ciclo de datos

**Decision**: Estado local en hooks con `useState` + `useEffect` y una
función `refresh()` en cada hook; fuente de verdad = Dexie. Los componentes
reciben datos por props y callbacks (presentación "tonta"). Sin contexto
global, sin Redux/Zustand (Artículo VII).

**Rationale**: el estado se deriva de consultas a BD; el patrón
dato → hook → componente es suficiente y testeable con
`@testing-library/react`.

**Alternatives**: Context API a nivel de app (rechazado: innecesario para
5 componentes que comparten casi nada de estado); Zustand (prohibido
explícitamente).

## R-09: Eliminación con confirmación

**Decision**: `EntryList` muestra cada entrada con botón "Eliminar" que
dispara diálogo de confirmación nativo (`window.confirm`, texto en
español) antes de invocar `deleteTimeEntry(id)`.

**Rationale**: Prevención de borrado accidental con cero dependencias
(Artículo VIII); UX simple y universal.

**Alternatives**: Modal propio (rechazado: más componentes sin valor en
MVP); eliminación instantánea sin confirmación (rechazado: riesgo de
pérdida de datos y confianza del usuario).

## R-10: Criterios de lista de duraciones

**Decision**: Constante tipada en core:
`DURATION_VALUES = [15, 30, 60, 120, 180, 240] as const` con tipo
`DurationValue = (typeof DURATION_VALUES)[number]`. El repositorio valida
antes de insertar y rechaza cualquier otro valor.

**Rationale**: Una sola fuente de verdad consumida por la UI (botones) y
por la validación; refuerza FR-001 y el caso límite "45 minutos".

**Alternatives**: Validación solo en la UI (rechazado: datos no confiables);
librería de validación (Zod) (rechazado: peso innecesario para una
constante, Artículo VII).

## Resumen de clausura

- **NEEDS CLARIFICATIONS en Technical Context**: 0 → todos resueltos.
- Riesgos residuales: cuota de almacenamiento (mitigado por R-06),
  comportamiento de `fake-indexeddb` ≈ IDB real (aceptado: implementación
  de referencia usada ampliamente).
