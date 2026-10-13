# Research: Rediseño Visual de la Interfaz con Modo Oscuro/Claro

**Feature**: `004-ui-redesign-dark-mode` | **Date**: 2026-10-12

Phase 0 del plan. Resuelve todos los unknowns del Technical Context y
fija las decisiones de diseño técnico. Sin [NEEDS CLARIFICATION] en el
spec; los puntos abiertos se resuelven aquí con defaults razonables.

---

## R1 — Arquitectura de tokens de tema (claro/oscuro)

**Decision**: Variables CSS con valores literales en `:root` y sobreescritos
en `.dark` (clase en `<html>`), mapeadas a `theme.extend.colors` de Tailwind
con `var(--…)` directos (sin envolver en `hsl()`). Los grises secundarios,
borders e inputs se derivan en CSS con `color-mix(in srgb, var(--foreground)
X%, var(--background))` en los porcentajes 5–14%.

Tokens semánticos (5 roles + acentos de la spec):

| Token CSS | Rol claro | Rol oscuro | Uso Tailwind |
|---|---|---|---|
| `--background` | `#f3f4f6` | `#0f1218` | `bg-background` |
| `--card` | `#ffffff` | `#161a22` | `bg-card` |
| `--foreground` | `#12151b` | `#ece8e1` | `text-foreground` |
| `--work` | `#3d5a8c` | `#8fa5cc` | `text-work`, `bg-work`, `border-work` |
| `--learning` | `#9a7429` | `#d8b46c` | `text-learning`, `bg-learning` |
| `--alert` | `#c2410c` | `#f0835a` | `text-alert`, `bg-alert` |
| `--muted` | color-mix 6% | color-mix 6% | `bg-muted` |
| `--border` | color-mix 10–14% | color-mix 10–14% | `border-border` |
| `--popover` | = `--card` | = `--card` | tooltips de Recharts |

**Rationale**: `.dark` en `<html>` es el patrón estándar con Tailwind
3.4 (`darkMode: 'class'`); los literales en CSS permiten `color-mix` y un
cambio de tema instantáneo sin re-render de JS; la dualidad de colores de
categoría queda como tokens vivos (`--work`/`--learning` cambian entre
modos) de modo que ningún componente necesita lógica de tema.

**Alternatives considered**:
- *Clase `data-theme` en `<html>`*: equivalente; se eligió `.dark` porque
  lo pide la spec explícitamente.
- *Tailwind v4 + `@theme`*: migración de major version fuera de alcance;
  el proyecto está en Tailwind 3.4.
- *CSS-in-JS o tokens en JS*: añade runtime y dependencias; innecesario
  para 2 modos estáticos.

## R2 — Tipografía: Instrument Serif + Geist auto-alojadas

**Decision**: Paquetes npm `@fontsource/instrument-serif` (regular +
italic) y `@fontsource-variable/geist-sans`, importados en `src/main.tsx`.
Se registran familias `--font-serif` / `--font-sans` en `index.css` y se
mapean en `theme.extend.fontFamily`. Las cifras usan `font-variant-numeric:
tabular-nums` (clase Tailwind `tabular-nums`). La fecha va en
`italic font-serif text-muted`.

**Rationale**: la app es PWA offline (vite-plugin-pwa); workbox ya precachea
`**/*.{woff2}` según la config actual, por lo que las fuentes viajan con el
build sin red. Fontsource expone CSS + woff2 listos para bundlers Vite.

**Alternatives considered**:
- *Google Fonts remoto*: rompe offline (Artículo IV del producto:
  operación completa sin conexión).
- *`next/font` o similares*: no aplica (Vite, no Next).

## R3 — Iconos: lucide-react

**Decision**: dependencia `lucide-react` para `Sun`, `Moon`,
`ChevronLeft`, `ChevronRight`, `CornerDownLeft` (icono Enter del botón
Registrar), `Download`, `Upload`, `Trash2`, `Pencil`. Tree-shakeable,
estándar de facto en ecosistemas React+Tailwind y el que pide la spec.

**Alternatives considered**: react-icons (bundle más grueso), SVGs
manuales (mantenimiento propio, fuera de alcance estético).

## R4 — Primitivos de botón "estilo shadcn/ui" sin CLI

**Decision**: implementar localmente `src/components/ui/cn.ts`
(`clsx` + `tailwind-merge`) y `src/components/ui/Button.tsx` con
`class-variance-authority` y variantes `default | outline | ghost | icon`
según la convención visual/API de shadcn/ui. **No** se ejecuta
`shadcn init` ni se añaden primitivos Radix.

**Rationale**: la spec solo pide las variantes de botón de shadcn; el
selector segmentado y las pestañas son componentes de dominio con diseño
propio (radiogroup segmentado teñido por categoría, pestañas Horas/%).
shadcn CLI añadiría `components.json`, dependencias y componentes no
usados, chocando con el Artículo VII (anti-sobreingeniería). Button sin
Radix es 100% accesible con `<button>` nativo + `aria-*`.

**Alternatives considered**:
- *shadcn init completo*: dependencias y scaffolding no utilizados.
- *Botones ad-hoc en cada componente* (estado actual): el rediseño exige
  consistencia de variantes en 6+ componentes; un primitivo compartido
  evita duplicación sin crear una "capa" nueva (es presentación).

## R5 — Migración de la gráfica: BarChart → LineChart con pestañas

**Decision**: reemplazar `BarChart` por `LineChart` de Recharts 2.15 con
`<Line type="monotone">`, `strokeWidth={2.5}`, `dot={{ r: 3 }}`,
`CartesianGrid vertical={false}`, `XAxis/YAxis` sin líneas de eje
(`axisLine={false}`, `tickLine={false}`), `Tooltip` con
`contentStyle` usando `var(--popover)`/`var(--foreground)`/`var(--border)`.
Dos pestañas controladas con botones nativos (`role="tablist"`/
`aria-selected`): "Horas" (series `work`/`learning` en minutos) y
"% Crecimiento" (serie única derivada, ver R7). Leyenda propia debajo:
segmentos cortos de 24px en `bg-work`/`bg-learning` con etiqueta.

**Rationale**: la spec pide líneas, no barras; `ReferenceLine y={0}` no
aplica pero la marca del eje se resuelve con grid horizontal. Las pestañas
son dos botones — sin Radix Tabs (R4). El tooltip usa tokens popover para
seguir el tema (FR-009).

**Alternatives considered**: *Recharts `ComposedChart`*: más superficie,
innecesaria; *librerías de chart nuevas (echarts, visx)*: fuera de
alcance y chocaría con "confianza en el stack existente" (Artículo VIII).

## R6 — Persistencia del tema: localStorage (no Dexie)

**Decision**: clave `bt:theme` en `localStorage` con valores `"light"` |
`"dark"`. Resolución inicial con función pura
`resolveInitialTheme(stored, prefersDark)` (core `theme.ts`). Script
inline anti-FOUC en `index.html` que aplica la clase antes del primer
paint. `useTheme` lee/escribe y expone `{ theme, toggle }`.

**Rationale**: el tema es preferencia de presentación, no dato de dominio;
el Artículo IV gobierna la persistencia de registros (IndexedDB) y no
exige que las preferencias de UI vivan ahí. `localStorage` es síncrono,
simple y el estándar para tema; además el script anti-FOUC necesita
leerlo antes de montar React.

**Alternatives considered**:
- *Dexie/table `preferences`*: asíncrono (no sirve para anti-FOCC antes
  del montaje) y mezclaría datos de dominio con UI.
- *Solo `matchMedia` sin persistencia*: no satisface SC-001 (recordar
  preferencia entre sesiones).

## R7 — Semántica de "% Crecimiento" en la pestaña de tendencia

**Decision**: serie diaria `growth = total > 0 ? round(learning / total *
100) : 0` (porcentaje del día dedicado a crecimiento, 0–100). Tooltip y
leyenda lo nombran "% Crecimiento". Función pura
`computeGrowthSeries(points: WeeklyTrendPoint[]): GrowthPoint[]` en
`src/core/weekly-trends.ts`.

**Rationale**: interpretable ("¿qué fracción de mi día fue crecimiento?"),
monótona con la intuición del medidor (misma métrica que el eje de
Aprendizaje del balance) y trivialmente testeable. Definir "crecimiento"
como delta inter-día sería confuso en una app de minutos absolutos.

**Alternatives considered**:
- *(learning − work) / total*: da negativos y un "índice de balance" que
  ya comunica el medidor; la pestaña pide crecimiento, no balance.
- *Variación porcentual vs día anterior*: 0 divisiones por días vacíos,
  series ruidosas.

## R8 — Veredicto del medidor: bandas de ratio (core puro)

**Decision**: `computeBalanceVerdict(balance: DailyBalance): BalanceVerdict`
con bandas sobre el share de aprendizaje (`l = learning/total`):

| Banda | Tono | Mensaje (ES) |
|---|---|---|
| `total === 0` | `empty` | "Aún no hay registros hoy. Empieza cuando quieras." |
| `0.40 ≤ l ≤ 0.60` | `balanced` | "Equilibrio saludable entre operación y crecimiento." |
| `0.25 ≤ l < 0.40` | `work-heavy` | "La operación pesa más de la cuenta; recupera tiempo de crecimiento." |
| `l < 0.25` | `work-extreme` | "Lo urgente está canibalizando tu tiempo de desarrollo." |
| `0.60 < l ≤ 0.75` | `learning-heavy` | "El crecimiento avanza; revisa que la operación no se frene." |
| `l > 0.75` | `learning-extreme` | "El crecimiento domina el día; la operación queda en pausa." |

Retorna además `workPercent` y `learningPercent` (redondeados, que suman
100) para la línea de debajo de la barra.

**Rationale**: convierte el ratio en interpretación (valor de US3); el
caso extremo usa literalmente el ejemplo de la spec; bandas cubren todo el
dominio sin solapamientos; función pura testeable (Artículo I).

**Alternatives considered**: textos hardcodeados en el componente (rompe
Library-First y el testing sin React).

## R9 — Navegación de días: DayNav (reemplaza DayPicker nativo)

**Decision**: `DayNav` con tres botones outline: anterior
(`ChevronLeft`), "Hoy", siguiente (`ChevronRight`), desplazando ±1 día
con la utilidad pura `addDays` existente. El botón "Hoy" se muestra
ativo/deshabilitado cuando la selección ya es hoy. El título de la
cabecera muestra "Hoy" cuando `selectedDate === getLocalToday()`, o el
nombre largo del día en español cuando es otro día (misma fecha larga en
cursiva). El input `type="date"` nativo se elimina (DayPicker se borra).

**Rationale**: la spec define la cabecera con "anterior, Hoy, siguiente"
(FR-004); un date picker nativo es visualmente inconsistente con la
dirección editorial y era la única pieza restante de DayPicker. La
navegación ±1 cubre el caso de uso real (revisar ayer/mañana) y mantiene
el contrato `selectedDate` de `App` intacto. `addDays` ya existe en core
y es pura.

**Alternatives considered**:
- *Mantener date input además de DayNav*: duplicidad de controles; la
  spec solo describe DayNav.
- *Calendario desplegable*: fuera del alcance del rediseño.

## R10 — Agrupación de entradas por categoría (core puro)

**Decision**: `groupEntriesByCategory(entries: TimeEntry[]): CategoryEntries`
retornando `{ work: TimeEntry[]; learning: TimeEntry[] }` preservando el
orden del arreglo de entrada (el repo ya ordena por `timestampCreation`).
`App` lo calcula una vez por render y lo pasa a dos `CategoryCard`.

**Rationale**: la spec organiza el día en dos tarjetas por categoría
(US4); agrupar es lógica derivada → core puro (Artículo I), testeable sin
React, y evita que dos componentes filtren duplicado.

**Alternatives considered**: filtrar en cada tarjeta con `.filter()`
(duplica lógica y la salida no es un contrato testable único).

## R11 — Sticky de la barra de registro y capas

**Decision**: `QuickEntryBar` envuelto en `sticky top-3 z-10` dentro del
flujo de la columna (`max-w-6xl` centrado). La tarjeta usa `bg-card`
(opaco, no translúcido) para que el contenido no se vea al pasar por
debajo. El registro solo se muestra cuando `selectedDate` es hoy
(conservando el comportamiento actual de `App`).

**Rationale**: comportamiento pedido por US2/FR-005; fondo opaco evita el
efecto glass que chocaría con "superficies planas, sin decoración".

**Alternatives considered**: barra fija con `position: fixed` (rompe el
ancho `max-w-6xl` y el flujo mobile); backdrop-filter (decorativo,
fuera de dirección estética).

## R12 — Estrategia de pruebas del rediseño

**Decision**:
1. **Unidades core (rojo→verde)**: `balance-verdict`, `entry-grouping`,
   `theme`, `computeGrowthSeries` (extiende `weekly-trends.test.ts`).
2. **Componentes RTL (jsdom)**: `ThemeToggle`, `CategorySelector`,
   `BalanceMeter`, `CategoryCard`, `DayNav`, `WeeklyTrends` (pestañas y
   leyenda), y actualización de `QuickEntryBar.test.tsx` (radiogroup,
   botones teñidos vía clase, reset silencioso preservado).
3. **Regresión**: la suite existente (integración fake-indexeddb +
   componentes) debe quedar 100% verde sin tocar la lógica de datos;
   solo se ajustan tests de componentes cuyo DOM/markup cambia.

Se prefiere testing por roles de accesibilidad (`getByRole('radio')`,
`getByRole('tab')`, `getByRole('meter')`) ante queries por texto para
que los tests validen también FR-011.

**Alternatives considered**: tests visuales/snapshot (frágiles, no
aportan a contratos); Playwright E2E (fuera del stack actual; el
quickstart cubre la validación manual end-to-end).

## R13 — Colores de Recharts y clases Tailwind dinámicas

**Decision**: los componentes de Recharts reciben los hex resueltos vía
una utilidad de lectura de CSS variable
(`getComputedStyle(document.documentElement).getPropertyValue('--work')`)
llamada en el render del componente y refrescada al cambiar `theme`
(dependencia del hook), **o** directamente `stroke="var(--work)"` — se
prefiere `var(--work)` en `stroke`/`fill` porque Recharts acepta strings
CSS. Para Tailwind, los colores de categoría **siempre** se usan con los
nombres de token (`bg-work`, `text-learning`), nunca con interpolación de
clases dinámicas (purge de Tailwind).

**Rationale**: `var(--…)` en SVG sigue el cambio de tema sin JS extra;
evita el clásico bug de purge.

## R14 — Paleta PWA (manifest) y meta theme-color

**Decision**: alinear `background_color` y `theme_color` del manifest con
los nuevos tokens (`#f3f4f6` / `#3d5a8c`) en `vite.config.ts`.

**Rationale**: coherencia del chrome del SO con la nueva paleta; cambio de
una línea, sin riesgo.

---

## Resumen de dependencias nuevas

| Paquete | Motivo | Tamaño aprox. |
|---|---|---|
| `lucide-react` | Iconos (tree-shaken) | pequeño (pocos íconos) |
| `class-variance-authority` | Variantes de Button | ~1 kB |
| `clsx` | Utilidad `cn` | <1 kB |
| `tailwind-merge` | Utilidad `cn` | ~8 kB |
| `@fontsource/instrument-serif` | Serif titular/cifras + italic | ~2 woff2 |
| `@fontsource-variable/geist-sans` | Sans interfaz | ~1 woff2 variable |

Ninguna dependencia toca la capa de datos; ninguna añade estado global.
