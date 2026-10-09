# Contract: Integration Hooks (Capa 2 — `src/hooks`)

**Style**: TypeScript signatures. Los hooks orquestan consultas + estado
local; no contienen lógica de negocio ni transforman datos (Artículos I y
VII). Estado local únicamente — sin contexto global.

```ts
// src/hooks/useDailyBalance.ts
export interface UseDailyBalance {
  balance: DailyBalance;          // siempre definido (ceros si vacío)
  loading: boolean;
  error: RepositoryErrorCode | null;   // code listo para traducir a español
  refresh: () => void;
}
export function useDailyBalance(date: string): UseDailyBalance;
// Recalcula cuando `date` cambia o cuando `refresh()` se invoca tras
// crear/eliminar una entrada.

// src/hooks/useWeeklyTrends.ts
export interface UseWeeklyTrends {
  points: WeeklyTrendPoint[];     // exactamente 7 elementos
  loading: boolean;
  error: RepositoryErrorCode | null;
  refresh: () => void;
}
export function useWeeklyTrends(endDate?: string): UseWeeklyTrends;
// endDate por defecto = hoy local.

// src/hooks/useTimeEntries.ts
export interface UseTimeEntries {
  entries: TimeEntry[];           // orden: fecha descendente, creación descendente
  loading: boolean;
  error: RepositoryErrorCode | null;
  refresh: () => void;
  save: (input: {
    category: Category;
    description: string;
    timeValue: DurationValue;
  }) => Promise<{ ok: true; entry: TimeEntry } | { ok: false; code: RepositoryErrorCode }>;
  remove: (id: string) => Promise<{ ok: true } | { ok: false; code: RepositoryErrorCode }>;
}
export function useTimeEntries(date: string): UseTimeEntries;
```

**Garantías del contrato**:
- `save` no rechaza (reject) jamás: resuelve con `{ ok, code }` para que la
  UI decida sin try/catch y sin exponer errores crudos.
- Éxito de `save` ⇒ el consumidor debe resetear `QuickEntryBar`
  (FR-008, reinicio silencioso y automático).
- Fallo de `save`/`remove` ⇒ notificación discreta usando `code`
  (FR-009); nunca se renderiza `stack` ni `message` de la excepción.
- Los hooks devuelven datos ya agregados; los componentes solo los pintan.
