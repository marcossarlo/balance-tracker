# Data Model: Rediseño Visual de la Interfaz con Modo Oscuro/Claro

**Feature**: `004-ui-redesign-dark-mode` | **Date**: 2026-10-12

El modelo de dominio **no cambia**. Este documento cubre (1) las entidades
existentes que el rediseño consume sin mutación, (2) los nuevos tipos de
presentación/derivados introducidos por el feature y (3) las reglas de
validación y transiciones de estado relevantes.

---

## 1. Entidades de dominio (intactas — referencia)

Fuente de verdad: `src/core/types.ts` y `src/core/time-entry.repo.ts`.
Sin migraciones, sin cambios de esquema Dexie (FR-012, Artículo IV).

### TimeEntry (Registro de tiempo)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `string` (UUID) | único e inmutable |
| `category` | `'WORK' \| 'LEARNING'` | mutuamente excluyente |
| `description` | `string` | trimmed, 1–200 caracteres |
| `timeValue` | `DurationValue` | ∈ {15, 30, 60, 120, 180, 240} minutos |
| `date` | `string` | ISO `YYYY-MM-DD`; índice principal |
| `timestampCreation` | `number` | unix ms de alta |

### DailyBalance (Balance diario) — ya tipado en core

| Campo | Tipo | Reglas |
|---|---|---|
| `work` | `number` | suma de minutos WORK del día |
| `learning` | `number` | suma de minutos LEARNING del día |
| `total` | `number` | `work + learning` |

### WeeklyTrendPoint (Punto de tendencia) — ya tipado en core

| Campo | Tipo | Reglas |
|---|---|---|
| `date` | `string` | `YYYY-MM-DD` |
| `label` | `string` | `DD/MM` |
| `work` | `number` | minutos del día |
| `learning` | `number` | minutos del día |

---

## 2. Nuevas entidades de presentación / derivadas

### BalanceVerdict (Veredicto del medidor)

Producida por `computeBalanceVerdict(balance: DailyBalance)` en
`src/core/balance-verdict.ts`. Entrada: `DailyBalance`. Sin I/O.

| Campo | Tipo | Reglas |
|---|---|---|
| `tone` | `'empty' \| 'balanced' \| 'work-heavy' \| 'work-extreme' \| 'learning-heavy' \| 'learning-extreme'` | ver bandas en research R8; `empty` ⇔ `total === 0` |
| `message` | `string` | texto ES del veredicto (tabla R8); siempre no vacío |
| `workPercent` | `number` | entero 0–100; `0` si `total === 0` |
| `learningPercent` | `number` | entero 0–100; `workPercent + learningPercent === 100` salvo `total === 0` (ambos 0) |

**Transiciones**: derivada, sin estado; se recalcula en cada render con el
`DailyBalance` vigente (la UI la muestra con `role="meter"` y
`aria-valuenow={learningPercent}`).

**Notas de redondeo**: `workPercent = total > 0 ? Math.round(work / total *
100) : 0`; `learningPercent = total > 0 ? 100 - workPercent : 0` (garantiza
que sumen 100 sin drift de redondeo).

### CategoryEntries (Agrupación del día)

Producida por `groupEntriesByCategory(entries: TimeEntry[])` en
`src/core/entry-grouping.ts`.

| Campo | Tipo | Reglas |
|---|---|---|
| `work` | `TimeEntry[]` | entradas `category === 'WORK'`, orden de entrada preservado |
| `learning` | `TimeEntry[]` | entradas `category === 'LEARNING'`, orden preservado |

**Invariantes**: `work.length + learning.length === entries.length`; sin
duplicados; sin pérdida de orden (el repo ya entrega por
`timestampCreation`).

### GrowthPoint (Serie de "% Crecimiento")

Producida por `computeGrowthSeries(points: WeeklyTrendPoint[])` en
`src/core/weekly-trends.ts`.

| Campo | Tipo | Reglas |
|---|---|---|
| `date` | `string` | heredado del punto fuente |
| `label` | `string` | heredado (`DD/MM`) |
| `growth` | `number` | entero 0–100: `total > 0 ? Math.round(learning / total * 100) : 0` donde `total = work + learning` |

**Invariantes**: mismo longitud y orden que el arreglo de entrada; sin
`NaN`/`Infinity` (los días vacíos son `0`).

### ThemePreference (Preferencia de tema)

Producida/consumida por `src/core/theme.ts` + `src/hooks/useTheme.ts`.

| Campo | Tipo | Reglas |
|---|---|---|
| `theme` | `'light' \| 'dark'` | valor efectivo activo |
| `stored` | `'light' \| 'dark' \| null` | lectura de `localStorage['bt:theme']` |
| `prefersDark` | `boolean` | `matchMedia('(prefers-color-scheme: dark)').matches` |

Funciones puras del core:

- `resolveInitialTheme(stored: 'light' | 'dark' | null, prefersDark: boolean): 'light' | 'dark'`
  — `stored` tiene prioridad; si es `null`, `prefersDark`.
- `toggleTheme(theme: 'light' | 'dark'): 'light' | 'dark'` — inverso.

**Efectos (fuera del core, en el hook)**: al montar y al cambiar `theme`,
el hook garantiza `document.documentElement.classList.toggle('dark',
theme === 'dark')` y `localStorage.setItem('bt:theme', theme)`. El script
anti-FOUC de `index.html` aplica la misma regla antes del primer paint
usando la misma clave.

---

## 3. View-models de composición (no core — calculados en App)

Estos no son entidades persistentes ni contratos de core; son la forma en
que `App` compone los datos ya resueltos para los componentes:

| View-model | Composición | Consumidor |
|---|---|---|
| Header context | `selectedDate`, `isToday = selectedDate === getLocalToday()`, fecha larga ES vía `Intl.DateTimeFormat('es')` | `AppHeader`, `DayNav` |
| Meter input | `DailyBalance` del día seleccionado → `BalanceVerdict` | `BalanceMeter` |
| Card input | `CategoryEntries` + etiqueta/color por categoría | `CategoryCard` ×2 |
| Trends input | `WeeklyTrendPoint[]` → pestaña Horas usa puntos crudos; pestaña % usa `GrowthPoint[]` | `WeeklyTrends` |

---

## 4. Reglas de validación que afectan al rediseño

Sin cambios respecto a la feature 001/003:

- Guardado: categoría obligatoria, descripción 1–200 trimmed, duración ∈
  catálogo → mensajes `role="alert"` inline en `QuickEntryBar`.
- Errores de repositorio → toast `role="status"` ~5 s (Artículo V).
- Eliminación/editar: confirmación y comportamiento de la feature 003 se
  conservan dentro de `CategoryCard`/`EntryList`.

Nuevas reglas de UI:

- La barra de registro solo se renderiza si `selectedDate` es hoy
  (conserva semántica actual: `createTimeEntry` siempre escribe la fecha
  local de hoy).
- Cambiar de tema NO re-renderiza datos ni re consulta la BD (solo
  clases CSS + localStorage).

## 5. Resumen de impacto

| Área | Cambio |
|---|---|
| Esquema Dexie | ninguno |
| Repositorios (`time-entry.repo`, `backup.repo`) | ninguno |
| Hooks de datos (`useTimeEntries`, `useDailyBalance`, `useWeeklyTrends`, `useBackup`) | ninguno (solo consumo desde nueva composición en `App`) |
| Core | +3 archivos nuevos, +1 función en `weekly-trends.ts` |
| Hooks UI | +1 (`useTheme`) |
| Componentes | reescritura presentacional; contratos de props se detallan en `contracts/` |
