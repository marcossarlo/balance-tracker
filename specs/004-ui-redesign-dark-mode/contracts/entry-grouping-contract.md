# Contract: groupEntriesByCategory (Agrupación para tarjetas)

**Feature**: `004-ui-redesign-dark-mode` | Módulo: `src/core/entry-grouping.ts`
**Capa**: core puro (Artículo I).

## Propósito

Separar las entradas del día en los dos arreglos que consume el par de
`CategoryCard` (US4, FR-007), sin duplicar `.filter()` en componentes.

## Superficie pública

```ts
import type { TimeEntry } from './types';

export interface CategoryEntries {
  work: TimeEntry[];
  learning: TimeEntry[];
}

export function groupEntriesByCategory(entries: TimeEntry[]): CategoryEntries;
```

## Reglas

1. `work` contiene exactamente las entradas con `category === 'WORK'`;
   `learning` las de `'LEARNING'`.
2. El orden relativo de cada arreglo **debe** preservar el orden del
   arreglo de entrada (el repo entrega por `timestampCreation`; la UI
   muestra más recientes primero o en orden — decisión de presentación,
   no de esta función).
3. Sin mutar el arreglo de entrada (inmutabilidad simple).
4. Invariantes: `work.length + learning.length === entries.length`; sin
   elementos repetidos entre arreglos.

## Casos de prueba mínimos (TDD rojo→verde)

| Entrada | Salida |
|---|---|
| `[]` | `{ work: [], learning: [] }` |
| 1 WORK + 1 LEARNING | un elemento en cada arreglo, mismo objeto (referencia) |
| 3 WORK seguidas | `work` de length 3 en el mismo orden |
| orden intercalado W, L, W | `work` = [1ª, 3ª]; `learning` = [2ª] |
| arreglo no es mutado | `entries` con el mismo orden tras la llamada |

## Consumidores

- `App` calcula `groupEntriesByCategory(entries)` una vez por render y
  pasa `verdictInput.work` / `.learning` a cada `CategoryCard`.

## Fuera de contrato

- No calcula totales de minutos (eso ya lo hace `useDailyBalance` /
  `computeDailyBalance`).
- No ordena: el orden lo aporta el repositorio.
