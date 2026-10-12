# Contract: Edit/Replace Data Layer + Hook (feature 003)

**Style**: TypeScript signatures. Extiende el contrato de
`specs/001-balance-tracker-mvp/contracts/data-layer.md` (crear/listar/
eliminar). Sin `update` ni `put` en ninguna firma (Artículo IV + FR-008).

```ts
// src/core/time-entry.repo.ts  (ampliación)

export interface EditTimeEntryInput {
  id: string;          // entrada existente a reemplazar
  category: Category;
  description: string;
  timeValue: DurationValue;
  // Sin `date`: la fecha se preserva desde la fila original (FR-004).
}

// Patrón borrar-y-recrear en transacción Dexie (delete + add; jamás update/put).
// 1) Valida campos (assertValidEntryFields) → RepositoryError('VALIDATION').
// 2) Carga la original por id; si no existe → RepositoryError('VALIDATION').
// 3) Transacción 'rw': elimina la fila original y crea una nueva con la MISMA
//    `date`, nuevo UUID y nuevo timestampCreation.
// 4) Retorna el TimeEntry persistido (el nuevo).
// Si `add` falla dentro de la transacción, el delete se revierte (rollback
// atómico): la fila original permanece intacta.
export function replaceTimeEntry(input: EditTimeEntryInput): Promise<TimeEntry>;
```

```ts
// src/hooks/useTimeEntries.ts  (ampliación)

export interface UseTimeEntries {
  entries: TimeEntry[];
  loading: boolean;
  error: RepositoryErrorCode | null;
  refresh: () => void;
  save: (input: CreateTimeEntryInput) => Promise<SaveResult>;
  remove: (id: string) => Promise<RemoveResult>;
  // Nuevo: reemplaza la entrada indicada; en éxito dispara refresh() interno.
  replace: (input: EditTimeEntryInput) => Promise<SaveResult>;
}

// SaveResult (existente, reutilizado):
// { ok: true; entry: TimeEntry } | { ok: false; code: RepositoryErrorCode }
```

```ts
// src/App.tsx  (cableado)

// handleReplace(input): llama replace(input); en éxito refreshAll()
// (balance diario + tendencias semanales); retorna el SaveResult a la UI.
<EntryList ... onReplace={handleReplace} />
```

```ts
// src/components/EditEntryForm.tsx  (presentación)

export interface EditEntryFormProps {
  entry: TimeEntry; // valores iniciales prellenados (id, category, description, timeValue)
  onReplace: (input: EditTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
  onCancel: () => void; // descarta cambios y cierra el formulario (FR-007)
}
```

```ts
// src/components/EntryList.tsx  (presentación — ampliación)

export interface EntryListProps {
  entries: TimeEntry[];
  loading: boolean;
  onRemove?: (id: string) => Promise<{ ok: true } | { ok: false; code: RepositoryErrorCode }>;
  // Nuevo: una fila en edición renderiza EditEntryForm inline en lugar de
  // sus controles normales. El estado editingId/saving vive en EntryList.
  onReplace?: (input: EditTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
}
```

**Garantías del contrato**:
- `replaceTimeEntry` jamás llama `update`/`put`; solo `get`/`delete`/`add`
  dentro de una transacción `rw`.
- En éxito, la base contiene exactamente una fila para los datos editados,
  con la `date` original y un `id` distinto al reemplazado.
- En fallo (validación, id inexistente, error de almacenamiento durante la
  transacción), la base queda **exactamente** igual que antes de la llamada.
- `replace` resuelve siempre con resultado tipado (nunca reject); la UI
  traduce `code` a mensajes ES amigables (Artículo V).
