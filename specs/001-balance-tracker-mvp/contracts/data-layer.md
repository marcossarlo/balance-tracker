# Contract: Data Layer (Capa 1 — `src/core`)

**Style**: TypeScript signatures (source of truth for implementation and
tests). Contrato estrictamente tipado — Artículo II. El UI no transforma
estas salidas.

```ts
// src/core/types.ts
export type Category = 'WORK' | 'LEARNING';

export const DURATION_VALUES = [15, 30, 60, 120, 180, 240] as const;
export type DurationValue = (typeof DURATION_VALUES)[number];

export interface TimeEntry {
  id: string;                 // UUID v4
  category: Category;
  description: string;        // trimmed, 1..200
  timeValue: DurationValue;   // minutos
  date: string;               // 'YYYY-MM-DD' (índice principal)
  timestampCreation: number;  // unix ms
}

export interface DailyBalance {
  work: number;               // minutos
  learning: number;           // minutos
  total: number;              // minutos
}

export interface WeeklyTrendPoint {
  date: string;               // 'YYYY-MM-DD'
  label: string;              // 'dd/mm'
  work: number;
  learning: number;
}

export type RepositoryErrorCode =
  | 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' | 'VALIDATION' | 'UNKNOWN';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
}
```

```ts
// src/core/time-entry.repo.ts  (promesas estrictamente tipadas)
export function createTimeEntry(input: {
  category: Category;
  description: string;
  timeValue: DurationValue;
}): Promise<TimeEntry>;                    // asigna id, date (hoy local), timestampCreation

export function listEntriesByDate(date: string): Promise<TimeEntry[]>;
export function listEntriesByRange(startDate: string, endDate: string): Promise<TimeEntry[]>;
export function deleteTimeEntry(id: string): Promise<void>;   // idempotente
export function getDailyBalance(date: string): Promise<DailyBalance>;   // pre-agregado
export function getWeeklyTrends(endDate: string): Promise<WeeklyTrendPoint[]>; // 7 puntos
```

```ts
// src/core/daily-balance.ts  (pura, sin IO)
export function computeDailyBalance(entries: TimeEntry[]): DailyBalance;

// src/core/weekly-trends.ts  (pura, sin IO)
export function computeWeeklyTrends(
  entries: TimeEntry[],
  weekDates: string[]       // 7 fechas 'YYYY-MM-DD' en orden cronológico
): WeeklyTrendPoint[];
```

**Garantías del contrato**:
- Ninguna función de `src/core` lanza errores crudos de IndexedDB; solo
  `RepositoryError` con `code`.
- Salidas siempre completas: `getWeeklyTrends` retorna exactamente 7
  puntos (días sin registros con `work=0, learning=0`).
- `getDailyBalance` retorna ceros si no hay entradas.
- No existe ninguna función `update*` en el contrato (Artículo IV).
