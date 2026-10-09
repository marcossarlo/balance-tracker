# Quickstart: Balance Tracker MVP

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md)

Guía de validación end-to-end. No contiene implementación; los contratos
están en [contracts/](./contracts/) y las reglas en [data-model.md](./data-model.md).

## Prerequisitos

- Node.js 20+ y npm instalados.
- Navegador moderno con soporte de IndexedDB y Service Worker.

## Setup

```bash
npm install
npm run dev          # entorno de desarrollo
npm run build        # build de producción (incluye PWA/service worker)
npm run preview      # sirve el build de producción
```

## Comandos de prueba

```bash
npm test             # Vitest: unidades + integración (fake-indexeddb)
npm run test:watch   # modo watch para TDD (rojo → verde)
```

Orden TDD exigido (Artículo III): ver **Secuencia de validación** abajo.

## Escenarios de validación

### V1 — Unidades puras (sin UI)

1. Correr suites de `src/core/daily-balance.ts` y `weekly-trends.ts`.
2. Esperado: agregados exactos en minutos; `computeWeeklyTrends` retorna
   siempre 7 puntos con días vacíos en cero; `timeValue=45` produce
   `ValidationError`.

### V2 — Repositorio con BD real en memoria (Artículo IX)

1. Correr suites del repositorio con `fake-indexeddb` (sin mocks de Dexie).
2. Esperado: `createTimeEntry` persiste con `date` de hoy local; la query
   `where('date').equals(...)` y el rango de 7 días usan el índice `date`
   (verificable insertando entradas en días dispersos y comprobando que
   solo retornan las del rango); `deleteTimeEntry` es idempotente.

### V3 — Registro rápido (US1 / FR-001, FR-008)

1. `npm run dev`, en la pantalla principal seleccionar "Trabajo", escribir
   descripción, elegir 60 min, guardar.
2. Esperado: la barra de entrada se limpia sola y en silencio; la entrada
   aparece en la lista del día; sin guardar (campos vacíos) aparece aviso
   amigable en español.

### V4 — Balance diario (US2 / FR-004)

1. Registrar 120 min Trabajo y 30 min Aprendizaje hoy.
2. Esperado: SplitDashboard muestra "Trabajo: 120 min",
   "Aprendizaje: 30 min", total 150; colores opuestos. Día sin registros
   ⇒ cero/estado vacío sin errores.

### V5 — Tendencia semanal (US3 / FR-005)

1. Registrar entradas en al menos 3 días distintos (o reloj del sistema).
2. Esperado: gráfica de 7 días en orden cronológico, dos series
   (Trabajo/Aprendizaje), días sin datos en cero, etiquetas en español.

### V6 — Corrección por eliminación (US4 / FR-006/FR-007)

1. Eliminar una entrada con su confirmación.
2. Esperado: desaparece de la lista; balance y tendencia se recalculan;
   no existe ningún formulario de edición en la app.
3. Falla simulada de BD ⇒ entrada sigue visible + notificación amigable.

### V7 — Offline (US5 / FR-010)

1. `npm run build && npm run preview`, cargar la app, cerrar la red
   (DevTools offline o desconexión física).
2. Esperado: registrar, balance, tendencia y eliminar funcionan igual;
   los datos sobreviven a recargar/cerrar el navegador.

### V8 — Errores amigables (FR-009 / SC-003)

1. Forzar fallo de cuota (o simular `QuotaExceededError` en el hook de
   pruebas) y guardar.
2. Esperado: toast/notificación discreta en español; nunca un stack trace
   ni mensaje crudo del navegador en pantalla.

## Criterios de aceptación del MVP

- Todos los tests en verde (`npm test`).
- V1–V8 ejecutados con los resultados esperados.
- Sin `UPDATE` en el código (búsqueda de `update(` en `src/core` ⇒ 0
  resultados fuera de documentación).
- UI visible en español; código/identificadores en inglés.
