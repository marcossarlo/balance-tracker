---

description: "Task list template for feature implementation"
---

# Tasks: Rediseño Visual de la Interfaz con Modo Oscuro/Claro

**Input**: Design documents from `/specs/004-ui-redesign-dark-mode/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **REQUIRED** — constitución Art. III (TDD estricto). Toda función
nueva de `src/core` (`balance-verdict`, `entry-grouping`, `growth-series`,
`theme`) y todo componente nuevo/reescrito tienen tests en rojo antes de la
implementación. Sin mocks de Dexie: la suite de integración existente corre
contra fake-indexeddb real y actúa de regresión (Art. IX, FR-012).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Feature incremental sobre el proyecto existente: `src/core`, `src/hooks`,
`src/components`, `src/components/ui`, `tests/` en la raíz del repositorio.
Guía estética de referencia: skill `frontend-design` + research R1–R14.

**Nota de catálogo de duraciones**: los botones rápidos de la spec son
15m/30m/1h/2h/4h (→ 15/30/60/120/240); se añade la píldora "3h" (→ 180)
para no perder acceso a ningún valor de `DURATION_VALUES` (FR-001 de la
spec base + FR-012 de esta).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Base sana y dependencias del rediseño

- [ ] T001 Run baseline verification: `npm test` and `npx tsc -b` at repository root must be green before starting (suite de las features 001–003)
- [ ] T002 Install redesign dependencies: `npm install lucide-react class-variance-authority clsx tailwind-merge @fontsource/instrument-serif @fontsource-variable/geist-sans` (research R2/R3/R13 — ninguna dependencia toca la capa de datos)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sistema de tokens de tema, tipografía y primitivos de botón que TODAS las historias consumen

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create the dual-mode token system in src/index.css per research R1: `:root` con `--background:#f3f4f6`, `--card:#ffffff`, `--foreground:#12151b`, `--work:#3d5a8c`, `--learning:#9a7429`, `--alert:#c2410c`; `.dark` con `--background:#0f1218`, `--card:#161a22`, `--foreground:#ece8e1`, `--work:#8fa5cc`, `--learning:#d8b46c`, `--alert:#f0835a`; grises derivados con `color-mix(in srgb, var(--foreground) X%, var(--background))` (5–14%) para `--muted`, `--muted-foreground`, `--border`; `--popover` espejo de `--card`; `--radius: 0.75rem` con escala 0.6x–2.6x (`--radius-sm/md/lg/xl/2xl/3xl` vía `calc`); familias `--font-serif: 'Instrument Serif', serif` y `--font-sans: 'Geist Variable', …` con `@layer base` (html usa font-sans) — **cero hex literales fuera de estas variables**
- [ ] T004 [P] Map tokens in tailwind.config.js per research R1/R2: `darkMode: 'class'`; `theme.extend.colors` → `background`, `card`, `foreground`, `work`, `learning`, `alert`, `muted`, `muted-foreground`, `border`, `popover` (cada una a `var(--…)` correspondiente); `fontFamily.serif/sans`; `borderRadius` con la escala desde `--radius`
- [ ] T005 [P] Register self-hosted fonts in src/main.tsx per research R2: imports de `@fontsource/instrument-serif` (400 + italic), `@fontsource/instrument-serif/400-italic.css` y `@fontsource-variable/geist-sans` antes del render; verificar que `npm run build` emite los woff2 en `dist/assets/`
- [ ] T006 Create UI primitives per contracts/ui-primitives-contract.md §1–2: src/components/ui/cn.ts (`twMerge(clsx(…))`) y src/components/ui/Button.tsx (cva con variantes `default|outline|ghost|icon`, clases comunes `rounded-xl focus-visible:ring-2 focus-visible:ring-foreground/40 disabled:opacity-50`, `type` por defecto `"button"`, forwardRef; **sin Radix, sin asChild** — Artículo VII)
- [ ] T007 Run `npm test` and `npx tsc -b` — suite completa GREEN con tokens y primitivos nuevos sin romper nada (aún no hay consumidores)

**Checkpoint**: Foundation ready — todas las historias pueden empezar (todas dependen de tokens + Button).

---

## Phase 3: User Story 1 - Interfaz renovada con jerarquía tipográfica y dualidad de colores (Priority: P1) 🎯 MVP

**Goal**: Layout editorial `max-w-6l`, cabecera con eyebrow bicolor + título serif "Hoy"/día + fecha larga cursiva + navegación de días, tipografía Instrument Serif/Geist activa, transferencias con iconos — con la data y el resto de secciones funcionando dentro del nuevo esqueleto.

**Independent Test**: Abrir la app ⇒ cabecera nueva (eyebrow bicolor, título serif, DayNav outline), columnas centradas con `gap`, cifras/títulos en serif con `tabular-nums`, colores de categoría consistentes; navegar días actualiza el balance; exportar/importar operan desde la cabecera (quickstart 2.1 + 2.7).

### Tests for User Story 1 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T008 [P] [US1] Failing component tests for DayNav in tests/component/DayNav.test.tsx (jsdom): botones accesibles por `aria-label` "Día anterior", "Ir a hoy", "Día siguiente"; click anterior ⇒ `onChange` recibe `addDays(value, -1)`, click siguiente ⇒ `addDays(value, +1)`; botón "Ir a hoy" con `disabled` cuando `value === getLocalToday()`; los tres usan la variante `outline` de Button
- [ ] T009 [P] [US1] Failing component tests for AppHeader in tests/component/AppHeader.test.tsx (jsdom): eyebrow con píldora bicolor (clase/estilo mitad `--work` mitad `--learning`) y texto "Balance Tracker"; con `isToday` ⇒ título "Hoy" y fecha larga en español en cursiva serif; sin `isToday` ⇒ título es el nombre largo del día en español (Intl `es`); renderiza DayNav y DataTransferButtons; el slot opcional `themeToggle` renderiza el nodo recibido (hueco para US5); título usa `font-serif`
- [ ] T010 [P] [US1] Update failing component tests for DataTransferButtons in tests/component/DataTransferButtons.test.tsx (extender, no duplicar): exportar/importar siguen llamando `onExport`/`onImport`; mensajes de error/toast `role="status"` ES intactos; los controles son `Button` con iconos lucide (`Download`/`Upload`) y `aria-label` accesible; el resumen de importación sigue visible
- [ ] T011 [US1] Run `npm test` and confirm T008–T010 fail RED (Artículo III)

### Implementation for User Story 1

- [ ] T012 [US1] Implement DayNav in src/components/DayNav.tsx per research R9: props `{ value: string; onChange: (date: string) => void }`; tres `Button variant="outline"` con iconos `ChevronLeft`/`ChevronRight` de lucide-react y labels ES; desplazamiento con `addDays` existente de src/core/weekly-trends.ts (sin nueva lógica de fechas) — turns T008 GREEN
- [ ] T013 [US1] Implement AppHeader in src/components/AppHeader.tsx per research R9: eyebrow (`text-xs uppercase tracking-widest font-medium`) con mini-píldora bicolor + "Balance Tracker"; título serif 30–48px "Hoy" o nombre del día + fecha larga `Intl.DateTimeFormat('es', { dateStyle: 'long' })` en `italic font-serif text-muted-foreground`; a la derecha DayNav + DataTransferButtons + slot `themeToggle?: ReactNode`; mobile-first flex-wrap con `gap-*` — turns T009 GREEN
- [ ] T014 [US1] Restyle DataTransferButtons in src/components/DataTransferButtons.tsx: reemplazar botones por `Button variant="outline"`/`variant="icon"` con iconos lucide `Download`/`Upload` y `aria-label` ES; conservar `ERROR_MESSAGES`, toasts `role="status"` ~5s y props contract intactas (solo presentación) — turns T010 GREEN
- [ ] T015 [US1] Rewrite src/App.tsx layout per research R9/R11 and FR-004: `<main className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-8">`; AppHeader arriba reemplazando el h1 suelto y el `DayPicker`; **eliminar src/components/DayPicker.tsx** y su import; el estado `selectedDate` y todos los handlers (save/remove/replace/backup) permanecen; SplitDashboard, QuickEntryBar, EntryList y WeeklyTrends siguen montados dentro del nuevo flujo (se reemplazan en US2–US6); ajustar tests existentes afectados por el cambio de DayPicker (tests/component/hooks-date-change.test.ts)
- [ ] T016 [US1] Run `npm test` and `npx tsc -b` — suite completa GREEN: MVP del rediseño visible (header + layout + tipografía + tokens) sin pérdida de funciones

**Checkpoint**: US1 fully functional — la app tiene la nueva identidad editorial y sigue registrando/balanceando/exportando (quickstart 2.1 + 2.7).

---

## Phase 4: User Story 2 - Registro rápido mejorado y siempre accesible (Priority: P2)

**Goal**: Barra de registro sticky `rounded-2xl` con input grande sin borde, selector segmentado accesible (`radiogroup`) teñido por categoría, píldoras de duración teñidas y botón "Registrar" con icono Enter; validación `role="alert"`; reinicio silencioso preservado.

**Independent Test**: Escribir descripción, elegir Aprendizaje ⇒ selector y píldoras en ocre; 15m/30m/1h/2h/3h/4h; "Registrar" o Enter guarda y la barra se limpia; sin dato ⇒ alerta ES y nada se guarda; la barra queda visible al hacer scroll (quickstart 2.2).

### Tests for User Story 2 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T017 [P] [US2] Failing component tests for CategorySelector in tests/component/CategorySelector.test.tsx (jsdom) per contracts/ui-primitives-contract.md §3: contenedor `role="radiogroup"` con `aria-label="Categoría"`; `value='WORK'` ⇒ radio "Trabajo" con `aria-checked=true` y "Aprendizaje" sin checked; click "Aprendizaje" ⇒ `onChange('LEARNING')`; `value=null` ⇒ ninguna opción checked; la opción activa usa clase de su token (`bg-work` o `bg-learning`)
- [ ] T018 [P] [US2] Rework failing component tests for QuickEntryBar in tests/component/QuickEntryBar.test.tsx (extender archivo existente): placeholder "¿En qué invertiste tu tiempo?" en el input (label `sr-only` "Descripción"); selector de categoría vía `radiogroup` (no los botones planos antiguos); píldoras "15m" "30m" "1h" "2h" "3h" "4h" (`aria-pressed`); con categoría seleccionada las píldoras llevan la clase del color de categoría; botón "Registrar" (icono Enter) con `type="submit"` y envío con Enter desde el input; validaciones ⇒ `<p role="alert">` ES y `onSave` no se llama; guardado ok ⇒ reset silencioso (conserva el test actual); error `ok:false` ⇒ toast `role="status"` ES
- [ ] T019 [US2] Run `npm test` and confirm T017–T018 fail RED (Artículo III)

### Implementation for User Story 2

- [ ] T020 [US2] Implement CategorySelector in src/components/CategorySelector.tsx per contracts/ui-primitives-contract.md §3 y research R1: props `{ value: Category | null; onChange: (category: Category) => void }`; contenedor `bg-muted border border-border p-1 rounded-xl inline-flex` con `role="radiogroup"`; opciones `<button role="radio" aria-checked>` con `CATEGORY_LABELS`; activa rellena con `bg-work`/`bg-learning` + `text-background`; inactiva `text-muted-foreground hover:bg-card`; foco `ring` visible — turns T017 GREEN
- [ ] T021 [US2] Rewrite QuickEntryBar in src/components/QuickEntryBar.tsx per research R11 and FR-005: envoltorio `sticky top-3 z-10`; tarjeta `bg-card border border-border rounded-2xl` con sombra casi nula; fila superior: input sin borde `bg-transparent text-lg` con placeholder de ayuda + CategorySelector; fila inferior separada por `border-t`: píldoras de `DURATION_VALUES` (label ES 15m/30m/1h/2h/3h/4h) teñidas con el token de la categoría seleccionada y `Button variant="default"` "Registrar" con `CornerDownLeft`; validación inline `role="alert"` y toasts `role="status"` conservando `ERROR_MESSAGES`; reinicio silencioso en éxito (Artículo V); props `onSave` intactas — turns T018 GREEN
- [ ] T022 [US2] Wire sticky registration in src/App.tsx per research R11: renderizar QuickEntryBar solo cuando `selectedDate === getLocalToday()` (semántica actual: `createTimeEntry` siempre escribe hoy) dentro del flujo sticky; ejecutar suite completa GREEN

**Checkpoint**: US2 fully functional — registro en <10s con la nueva barra (SC-002), teñido por categoría y accesible por teclado.

---

## Phase 5: User Story 3 - Medidor de equilibrio con veredicto (Priority: P3)

**Goal**: Veredicto serif grande según el ratio, barra `h-3` dual con marca al 50% y anchuras animadas, línea de porcentajes; reemplaza al SplitDashboard.

**Independent Test**: Registrar ratios conocidos (50/50, 75/25, 100/0, día vacío) ⇒ veredicto, % y proporción de barra exactos; `role="meter"` accesible (quickstart 2.3).

### Tests for User Story 3 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T023 [P] [US3] Failing unit tests for computeBalanceVerdict in tests/unit/balance-verdict.test.ts per contracts/balance-verdict-contract.md: casos exactos de la tabla del contrato — `{0,0,0}` ⇒ `empty` + ambos % 0; `{60,60,120}` ⇒ `balanced` 50/50; `{90,30,120}` ⇒ `work-heavy` 75/25; `{105,15,120}` ⇒ `work-extreme` 88/12; `{30,90,120}` ⇒ `learning-heavy` 25/75; `{15,105,120}` ⇒ `learning-extreme` 12/88; `{1,0,1}` ⇒ `work-extreme` 100/0; mensajes ES exactos del contrato; invariant `workPercent + learningPercent === 100` salvo `total===0`
- [ ] T024 [P] [US3] Failing component tests for BalanceMeter in tests/component/BalanceMeter.test.tsx (jsdom): elemento con `role="meter"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow={learningPercent}`, `aria-label` del balance; titular = `verdict.message` en `font-serif`; dos segmentos de barra con anchuras `workPercent%`/`learningPercent%` (clase `transition-[width] duration-700`); marca fina al 50%; línea inferior muestra ambos porcentajes en los colores de categoría; `tone==='empty'` ⇒ barra en cero y veredicto visible
- [ ] T025 [US3] Run `npm test` and confirm T023–T024 fail RED (Artículo III)

### Implementation for User Story 3

- [ ] T026 [US3] Implement computeBalanceVerdict in src/core/balance-verdict.ts per contracts/balance-verdict-contract.md and research R8: función pura con las 6 bandas, mensajes ES exactos del contrato, porcentajes redondeados que suman 100 (`learningPercent = 100 - workPercent`); exporta `BalanceVerdict`, `BalanceVerdictTone`; **cero I/O, cero React** (Artículo I) — turns T023 GREEN
- [ ] T027 [US3] Implement BalanceMeter in src/components/BalanceMeter.tsx per FR-006: props `{ balance: DailyBalance }`; titular serif 30–48px `text-balance`; barra `h-3 rounded-full overflow-hidden flex` con dos divs `bg-work`/`bg-learning` y anchuras porcentuales animadas (`transition-[width] duration-700`); marca al 50% (`absolute left-1/2` línea fina); línea "% operación · {work}% · crecimiento {learning}%" en tokens de categoría; contenedor `role="meter"` accesible — turns T024 GREEN
- [ ] T028 [US3] Swap dashboard in src/App.tsx: reemplazar el montaje de SplitDashboard por `<BalanceMeter balance={balance} />`; **eliminar src/components/SplitDashboard.tsx** y sus imports; los totales por categoría los aportarán las tarjetas de US4; ejecutar suite GREEN (los totales grandes llegan con US4)

**Checkpoint**: US3 fully functional — el medidor interpreta el día y la barra dual refleja el ratio exacto.

---

## Phase 6: User Story 4 - Tarjetas de categoría con totales y estados vacíos (Priority: P4)

**Goal**: Dos tarjetas (grid solo en desktop) con cabecera teñida al 10%, total de horas serif 60px `tabular-nums`, lista compacta con editar/eliminar (feature 003 conservada) y estado vacío atenuado.

**Independent Test**: Entradas de ambas categorías ⇒ cada tarjeta lista las suyas con total correcto; categoría vacía ⇒ texto atenuado; editar/eliminar funcionan dentro de la tarjeta; en móvil se apilan sin scroll horizontal (quickstart 2.4).

### Tests for User Story 4 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T029 [P] [US4] Failing unit tests for groupEntriesByCategory in tests/unit/entry-grouping.test.ts per contracts/entry-grouping-contract.md: `[]` ⇒ `{work:[],learning:[]}`; W+L ⇒ un objeto (misma referencia) por arreglo; 3 WORK ⇒ orden preservado; intercalado W,L,W ⇒ work=[1ª,3ª], learning=[2ª]; invariante `work.length + learning.length === entries.length`; el arreglo de entrada no se muta
- [ ] T030 [P] [US4] Failing component tests for CategoryCard in tests/component/CategoryCard.test.tsx (jsdom): cabecera teñida con el token de la categoría al 10% de opacidad (color-mix o clase equivaliente) y eyebrow; total de minutos formateado en horas en `font-serif tabular-nums` (~60px); lista renderiza una fila por entrada de ESA categoría; `entries=[]` ⇒ estado vacío ES atenuado ("Sin registros de …"); descripción larga trunca con ellipsis sin desbordar; conserva acciones "Editar"/"Eliminar" por fila (contrato de la feature 003)
- [ ] T031 [P] [US4] Update failing EntryList row tests in tests/component/EntryList.test.tsx (extender): filas compactas consumidas dentro de CategoryCard; editar/eliminar/flujo EditEntryForm siguen pasando; markup ajustado a los tokens (sin gray-* literales)
- [ ] T032 [US4] Run `npm test` and confirm T029–T031 fail RED (Artículo III)

### Implementation for User Story 4

- [ ] T033 [US4] Implement groupEntriesByCategory in src/core/entry-grouping.ts per contracts/entry-grouping-contract.md and research R10: pura, sin mutar, preserva orden; interfaz `CategoryEntries` — turns T029 GREEN
- [ ] T034 [US4] Rework EntryList in src/components/EntryList.tsx for compact rows inside cards: eliminar wrappers de sección propios (la tarjeta aporta cabecera/título); filas con descripción (`truncate`), duración y acciones editar/eliminar con iconos lucide `Pencil`/`Trash2` + `aria-label`; conservar `onRemove`/`onReplace`/`EditEntryForm` inline y estados `loading` de la feature 003; estilos solo con tokens — turns T031 GREEN
- [ ] T035 [US4] Implement CategoryCard in src/components/CategoryCard.tsx per FR-007: props `{ category: Category; total: number; entries: TimeEntry[]; onRemove; onReplace }`; cabecera con `color-mix(… var(--work/learning) 10% …)` de fondo, eyebrow + `CATEGORY_LABELS` y total de horas a la derecha (`font-serif text-[60px] leading-none tabular-nums`, formato "6,5 h" vía `Intl.NumberFormat('es')`); `<EntryList>` como cuerpo; estado vacío atenuado — turns T030 GREEN
- [ ] T036 [US4] Compose cards in src/App.tsx per FR-007/FR-010: `const grouped = groupEntriesByCategory(entries)`; grid `grid-cols-1 md:grid-cols-2 gap-6`; dos `CategoryCard` (WORK con `balance.work`, LEARNING con `balance.learning`); ejecutar suite GREEN

**Checkpoint**: US4 fully functional — el día se escanea en dos tarjetas con totales protagonistas y corrección de entradas intacta.

---

## Phase 7: User Story 5 - Modo oscuro y claro con preferencia persistente (Priority: P5)

**Goal**: Control sol/luna en la cabecera que alterna el tema al instante en toda la interfaz (incl. gráfica), persiste en `localStorage['bt:theme']`, respeta `prefers-color-scheme` en la primera visita y no parpadea al cargar.

**Independent Test**: Alternar ⇒ cambio instantáneo total; recargar ⇒ tema elegido persiste; ventana incógnita con OS oscura ⇒ arranca oscuro; sin flash blanco (quickstart 2.5).

### Tests for User Story 5 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T037 [P] [US5] Failing unit tests for theme core in tests/unit/theme.test.ts per contracts/theme-contract.md §1: `resolveInitialTheme('dark', false)='dark'`; `('light', true)='light'`; `(null, true)='dark'`; `(null, false)='light'`; `toggleTheme('light')='dark'` y viceversa; `THEME_STORAGE_KEY === 'bt:theme'`
- [ ] T038 [P] [US5] Failing hook tests for useTheme in tests/component/useTheme.test.tsx (jsdom, mock de `matchMedia`): al montar con storage vacío y `prefersDark=false` ⇒ sin clase `dark` en `documentElement`; con `prefersDark=true` ⇒ clase `dark` aplicada; `toggle()` ⇒ alterna la clase y escribe `localStorage['bt:theme']`; con storage `'light'` preexistente y `prefersDark=true` ⇒ persiste `light` (la preferencia guardada tiene prioridad)
- [ ] T039 [P] [US5] Failing component tests for ThemeToggle in tests/component/ThemeToggle.test.tsx (jsdom): control con `aria-label` dinámico "Cambiar a modo oscuro"/"Cambiar a modo claro"; muestra icono `Moon` en claro y `Sun` en oscuro; click ⇒ llama `toggle` del hook (mock o integration con localStorage)
- [ ] T040 [US5] Run `npm test` and confirm T037–T039 fail RED (Artículo III)

### Implementation for User Story 5

- [ ] T041 [US5] Implement theme core in src/core/theme.ts per contracts/theme-contract.md §1 and research R6: `Theme`, `StoredTheme`, `THEME_STORAGE_KEY`, `resolveInitialTheme`, `toggleTheme` puras (sin localStorage ni DOM en el core) — turns T037 GREEN
- [ ] T042 [US5] Implement useTheme in src/hooks/useTheme.ts per contracts/theme-contract.md §2: resolución inicial con `localStorage` + `matchMedia('(prefers-color-scheme: dark)')`; efecto que sincroniza `document.documentElement.classList.toggle('dark', …)` y persiste la clave; `toggle()`; fallback en memoria si `localStorage` lanza (nunca romper la UI); sin reconsultas de datos — turns T038 GREEN
- [ ] T043 [US5] Implement ThemeToggle in src/components/ThemeToggle.tsx per FR-008: `Button variant="icon"` con iconos lucide `Sun`/`Moon`, `aria-label` dinámico ES, foco `ring`; consume `useTheme()` — turns T039 GREEN
- [ ] T044 [US5] Activate theme end-to-end: añadir script anti-FOUC inline en index.html per contracts/theme-contract.md §3 (misma clave/regla, try/catch); pasar `<ThemeToggle />` al slot `themeToggle` de AppHeader desde src/App.tsx; actualizar `background_color: '#f3f4f6'` y `theme_color: '#3d5a8c'` del manifest en vite.config.ts (research R14); verificar que el Tooltip de Recharts (US6) y todas las tarjetas cambian con los tokens; suite GREEN

**Checkpoint**: US5 fully functional — los dos modos son simétricos y la preferencia sobrevive a recargas (SC-001, SC-004).

---

## Phase 8: User Story 6 - Tendencia de 7 días con pestañas y leyenda (Priority: P6)

**Goal**: Migración de barras a líneas con pestañas "Horas"/"% Crecimiento", descripción dinámica, `<dl>` de dos totales, tooltips con tokens popover y leyenda de segmentos cortos.

**Independent Test**: Registros en varios días ⇒ pestaña Horas con dos líneas por categoría; pestaña % con la serie 0–100; tooltip legible en ambos temas; leyenda correcta (quickstart 2.6).

### Tests for User Story 6 ⚠️ (WRITE FIRST — MUST FAIL)

- [ ] T045 [P] [US6] Extend failing unit tests in tests/unit/weekly-trends.test.ts per contracts/trend-growth-contract.md: `computeGrowthSeries` — `{0,0}` ⇒ 0; `{60,60}` ⇒ 50; `{90,30}` ⇒ 25; `{0,45}` ⇒ 100; `{45,0}` ⇒ 0; `{1,1}` ⇒ 50; arreglo de 7 ⇒ 7 con mismo orden de `date`; sin `NaN`/`Infinity`; no muta la entrada
- [ ] T046 [P] [US6] Failing component tests for WeeklyTrends in tests/component/WeeklyTrends.test.tsx (jsdom, mock ligero de ResponsiveContainer): `role="tablist"` con pestañas "Horas" y "% Crecimiento" y `aria-selected`; en Horas ⇒ dos series por nombre "Trabajo"/"Aprendizaje"; en % ⇒ una serie "Crecimiento"; leyenda con un segmento corto de color por categoría bajo el gráfico; descripción dinámica y `<dl>` con los dos totales de la semana visibles; panel `role="tabpanel"`
- [ ] T047 [US6] Run `npm test` and confirm T045–T046 fail RED (Artículo III)

### Implementation for User Story 6

- [ ] T048 [US6] Implement computeGrowthSeries in src/core/weekly-trends.ts per contracts/trend-growth-contract.md and research R7: `growth = total > 0 ? Math.round(learning / total * 100) : 0`; exporta `GrowthPoint`; extiende el módulo existente sin tocar `computeWeeklyTrends` — turns T045 GREEN
- [ ] T049 [US6] Rewrite WeeklyTrends in src/components/WeeklyTrends.tsx per FR-009 and research R5/R13: `LineChart` (Recharts API nativa, Artículo VIII) con `<Line type="monotone" strokeWidth={2.5} dot={{ r: 3 }}>`; `CartesianGrid vertical={false}`; `XAxis`/`YAxis` con `axisLine={false} tickLine={false}`; `Tooltip` con `contentStyle` usando `var(--popover)`, `var(--foreground)`, `var(--border)`; colores de serie `var(--work)`/`var(--learning)`; pestañas controladas `role="tablist"`/`role="tab"`/`aria-selected` con panel `role="tabpanel"`; estado local `tab: 'hours' | 'growth'` (sin librería de tabs); leyenda custom de segmentos 24px; título serif + descripción dinámica + `<dl>` de totales semanales; altura `h-64` conservada — turns T046 GREEN
- [ ] T050 [US6] Run full `npm test` and `npx tsc -b` — GREEN: todas las historias integradas en la app rediseñada

**Checkpoint**: US6 fully functional — la tendencia completa el valor histórico con la nueva estética.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verificación integral y auditorías transversales

- [ ] T051 [P] Run full verification: `npm test`, `npx tsc -b`, `npm run build` — todo GREEN, sin tests omitidos, bundle PWA con woff2 incluidos
- [ ] T052 [P] Constitution audit: grep en src/ — cero hex literales de la paleta fuera de src/index.css (los únicos `#` permitidos son los del sistema de tokens; `var(--…)` en Recharts OK per research R13); cero `update(`/`put(` en src/core (Artículo IV); cero estado global (Artículo VII); dependencias nuevas exactamente las de T002 (Artículo VIII); toda lógica derivada vive en src/core puro (Artículo I)
- [ ] T053 [P] Accessibility + language audit: `role="meter"` con aria-values (BalanceMeter), `radiogroup`/`radio` (CategorySelector), `tablist`/`tab`/`tabpanel` (WeeklyTrends), `alert`/`status` (QuickEntryBar/DataTransferButtons), `aria-label` en todo control icon-only (ThemeToggle, DayNav, acciones de fila), `focus-visible:ring` en Button y controles custom; toda UI en español (títulos, veredictos, estados vacíos, tooltips, mensajes) y nombres de código en inglés (Artículo VI)
- [ ] T054 Execute quickstart.md end-to-end: secciones 1–3 (suite, build, dev) con el checklist 2.1–2.7 y verificación PWA offline de fuentes; probar ancho 320px sin scroll horizontal (FR-010), `prefers-reduced-motion` ⇒ sin animación de la barra del medidor, y tema oscuro en la gráfica/tooltips; registrar resultados al final de quickstart.md
- [ ] T055 Cleanup: confirmar eliminación de src/components/DayPicker.tsx y src/components/SplitDashboard.tsx sin imports muertos; `npm run preview` con red cortada ⇒ app y fuentes cargan offline; refactor solo si es trivial y verde (Artículo VII — sin abstracciones prematuras)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories** (tokens + Button compartidos)
- **US1 (Phase 3)**: Depends on Phase 2 — MVP (header, layout, tipografía, dualidad de colores)
- **US2 (Phase 4)**: Depends on US1 (Button + tokens + App como host del sticky)
- **US3 (Phase 5)**: Depends on US1 (tokens + App como host; reemplaza SplitDashboard)
- **US4 (Phase 6)**: Depends on US1 (tokens + App grid; EntryList ya existe de la feature 003)
- **US5 (Phase 7)**: Depends on US1 (slot `themeToggle` del AppHeader + Button icon)
- **US6 (Phase 8)**: Depends on US1 (tokens popover + App monta WeeklyTrends)
- **Polish (Phase 9)**: Depends on todas las historias deseadas

### User Story Dependencies

- **US1 (P1)**: After Foundational — independiente (MVP)
- **US2–US6**: After US1 — independientes entre sí (todas usan tokens/Button/App ya rediseñados en US1); orden de prioridad P2→P6 recomendado pero opcional

### Within Each User Story

- Tests MUST fail (RED) before implementation (Artículo III)
- Core puro → hook (si aplica) → componente → wiring en App

### Parallel Opportunities

- T003 ⇄ T004 ⇄ T005 (css / config / main.tsx — distintos archivos)
- T008 ⇄ T009 ⇄ T010 (tests de DayNav/AppHeader/DataTransferButtons)
- T017 ⇄ T018 (tests de CategorySelector/QuickEntryBar)
- T023 ⇄ T024 (unit core / componente BalanceMeter)
- T029 ⇄ T030 ⇄ T031 (unit core / CategoryCard / EntryList)
- T037 ⇄ T038 ⇄ T039 (unit theme / hook / ThemeToggle)
- T045 ⇄ T046 (unit growth / componente WeeklyTrends)
- T051–T053 (verificación + auditorías transversales)
- Tras Foundational, US2–US6 son paralelizables entre desarrolladores (distintos archivos; cuidado solo con el wiring de App.tsx — resuelto secuencialmente o con rebase por sección)

---

## Parallel Example: User Story 2

```bash
# En paralelo (tests en rojo):
Task: "Failing component tests CategorySelector in tests/component/CategorySelector.test.tsx"
Task: "Rework failing component tests QuickEntryBar in tests/component/QuickEntryBar.test.tsx"

# Tras RED, implementación:
Task: "Implement CategorySelector in src/components/CategorySelector.tsx"
Task: "Rewrite QuickEntryBar in src/components/QuickEntryBar.tsx"

# Luego el wiring:
Task: "Wire sticky registration in src/App.tsx + suite GREEN"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 baseline + dependencias → Phase 2 tokens/primitivos
2. Phase 3: cabecera + DayNav + layout editorial + tipografía (rojo→verde)
3. **STOP and VALIDATE**: quickstart 2.1 + 2.7 — la app mantiene registrar/balance/exportar con la nueva identidad
4. Demo: interfaz renovada en claro con dualidad de colores (SC-003, SC-008)

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → validar → identidad editorial (MVP!)
3. US2 → validar → registro rápido sticky accesible (SC-002)
4. US3 → validar → medidor con veredicto (SC-005)
5. US4 → validar → tarjetas con totales y corrección intacta
6. US5 → validar → dark mode persistente sin flash (SC-001, SC-004)
7. US6 → validar → tendencia de líneas con pestañas
8. Polish → quickstart completo + auditorías (SC-006, SC-007)

### Parallel Team Strategy

1. Equipo completa Setup + Foundational
2. US1 en paralelo con la preparación de tests rojos de US2–US6 (archivos de test no pisan implementación)
3. Tras US1: Developers A–E en US2–US6 (Archivos independientes; App.tsx se integra por historias en orden o con rebase fino)
4. Polish en conjunto

---

## Notes

- [P] tasks = different files, no dependencies
- Tests use jsdom/RTL para componentes y funciones puras; la integración fake-indexeddb existente es regresión — **no se añade lógica Dexie nueva** (FR-012, Artículo IV)
- `QuickEntryBar` y `WeeklyTrends` reescritos conservan sus contratos públicos (`onSave`; `points`/`loading`) salvo donde la spec pide cambio explícito
- Los mensajes de veredicto y las etiquetas de UI son **exactamente** los de los contratos (contratos/balance-verdict-contract.md §2)
- Commit after each task or logical group (mensajes en inglés, Artículo VI)
- Stop at any checkpoint to validate story independently
- Duraciones: píldoras 15m/30m/1h/2h/**3h**/4h — la "3h" preserva el acceso a 180 min del catálogo base (ver nota al inicio)
