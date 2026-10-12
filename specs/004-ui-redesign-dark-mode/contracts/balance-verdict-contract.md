# Contract: BalanceVerdict (Medidor de equilibrio)

**Feature**: `004-ui-redesign-dark-mode` | Módulo: `src/core/balance-verdict.ts`
**Capa**: core puro (Artículo I) — sin I/O, sin React, sin Dexie.

## Propósito

Convertir un `DailyBalance` en un veredicto textual + porcentajes para el
`BalanceMeter` (US3, FR-006).

## Superficie pública

```ts
import type { DailyBalance } from './types';

export type BalanceVerdictTone =
  | 'empty'
  | 'balanced'
  | 'work-heavy'
  | 'work-extreme'
  | 'learning-heavy'
  | 'learning-extreme';

export interface BalanceVerdict {
  tone: BalanceVerdictTone;
  message: string;
  workPercent: number;   // 0–100 entero
  learningPercent: number; // 0–100 entero
}

export function computeBalanceVerdict(balance: DailyBalance): BalanceVerdict;
```

## Reglas

1. `l = total > 0 ? learning / total : 0`.
2. Bandas (excluyentes, cubren todo el dominio):

   | Condición | `tone` | `message` (ES, exacta) |
   |---|---|---|
   | `total === 0` | `empty` | `Aún no hay registros hoy. Empieza cuando quieras.` |
   | `0.40 ≤ l ≤ 0.60` | `balanced` | `Equilibrio saludable entre operación y crecimiento.` |
   | `0.25 ≤ l < 0.40` | `work-heavy` | `La operación pesa más de la cuenta; recupera tiempo de crecimiento.` |
   | `l < 0.25` | `work-extreme` | `Lo urgente está canibalizando tu tiempo de desarrollo.` |
   | `0.60 < l ≤ 0.75` | `learning-heavy` | `El crecimiento avanza; revisa que la operación no se frene.` |
   | `l > 0.75` | `learning-extreme` | `El crecimiento domina el día; la operación queda en pausa.` |

3. Porcentajes:
   - `total === 0` → `workPercent = 0`, `learningPercent = 0`.
   - si no: `workPercent = Math.round(work / total * 100)`; `learningPercent = 100 - workPercent`.

## Casos de prueba mínimos (TDD rojo→verde)

| Entrada `{work, learning, total}` | Salida esperada |
|---|---|
| `{0, 0, 0}` | `tone: 'empty'`, ambos porcentajes `0` |
| `{60, 60, 120}` | `balanced`, `50/50` |
| `{90, 30, 120}` | `work-heavy`, `75/25` |
| `{105, 15, 120}` | `work-extreme`, `88/12` |
| `{30, 90, 120}` | `learning-heavy`, `25/75` |
| `{15, 105, 120}` | `learning-extreme`, `13/87` (`Math.round(12.5) = 13`) |
| `{1, 0, 1}` | `work-extreme`, `100/0` |

## Consumidores

- `BalanceMeter` (presentación): renderiza `message` como titular serif y
  `workPercent`/`learningPercent` como anchuras de la barra y línea de
  porcentajes; expone `role="meter"` con `aria-valuenow = learningPercent`.

## Fuera de contrato

- No formatea horas ni aplica colores (la UI asigna tokens por categoría).
- No accede a fecha ni BD: el caller (`App`) resuelve el `DailyBalance`.
