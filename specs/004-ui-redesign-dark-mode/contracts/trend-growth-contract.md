# Contract: computeGrowthSeries (Pestaña "% Crecimiento")

**Feature**: `004-ui-redesign-dark-mode` | Módulo: `src/core/weekly-trends.ts`
**Capa**: core puro (Artículo I). Extiende el módulo existente.

## Propósito

Transformar la serie semanal de minutos en la serie de porcentaje de
crecimiento que muestra la pestaña "% Crecimiento" de `WeeklyTrends`
(US6, FR-009).

## Superficie pública

```ts
import type { WeeklyTrendPoint } from './types';

export interface GrowthPoint {
  date: string;  // heredado
  label: string; // heredado (DD/MM)
  growth: number; // entero 0–100
}

export function computeGrowthSeries(points: WeeklyTrendPoint[]): GrowthPoint[];
```

## Reglas

1. Para cada punto: `total = work + learning`.
2. `growth = total > 0 ? Math.round((learning / total) * 100) : 0`.
3. Misma longitud y orden que `points` (los 7 días se muestran siempre,
   días vacíos = 0 — coherente con FR-005 de la spec base).
4. Sin `NaN`/`Infinity`: la guarda `total > 0` cubre `{0,0}`.
5. No muta el arreglo de entrada.

## Casos de prueba mínimos (TDD rojo→verde — extiende `weekly-trends.test.ts`)

| Entrada point | Salida `growth` |
|---|---|
| `{work: 0, learning: 0}` | `0` |
| `{work: 60, learning: 60}` | `50` |
| `{work: 90, learning: 30}` | `25` |
| `{work: 0, learning: 45}` | `100` |
| `{work: 45, learning: 0}` | `0` |
| `{work: 1, learning: 1}` | `50` |
| arreglo de 7 puntos | arreglo de 7, mismo orden de `date` |

## Consumidores

- `WeeklyTrends` (presentación): en pestaña "% Crecimiento" hace
  `computeGrowthSeries(points)` y renderiza una `<Line dataKey="growth">`;
  en pestaña "Horas" usa `points` crudos con las dos líneas por categoría.

## Fuera de contrato

- No define pestañas ni UI; no accede a la BD (el hook
  `useWeeklyTrends` existente sigue entregando `WeeklyTrendPoint[]`).
- No calcula tendencia inter-anual ni deltas vs. período anterior.
