# Contract: Backup Data Layer + Hook (feature 002)

**Style**: TypeScript signatures. Amplía el contrato de
`specs/001-balance-tracker-mvp/contracts/data-layer.md`. Sin `update` ni
`delete` en ninguna firma (Artículo IV).

```ts
// src/core/backup-file.ts  (puras, sin IO)
export interface BackupFile {
  app: 'balance-tracker';
  version: 1;
  exportedAt: number;
  entries: TimeEntry[];
}

export const BACKUP_APP = 'balance-tracker';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_TEXT_BYTES = 10 * 1024 * 1024; // 10 MB

// Lanza RepositoryError('BACKUP_INVALID' | 'BACKUP_TOO_LARGE') ante
// JSON malformado, marca/versión desconocidas, entries inválidas o
// archivo demasiado grande. Nunca lanza errores crudos de JS.
export function parseBackupFile(text: string): BackupFile;

export function serializeBackupFile(entries: TimeEntry[], now?: number): string;
export function buildBackupFileName(dateIso: string): string; // 'balance-tracker-YYYY-MM-DD.json'
```

```ts
// src/core/backup.repo.ts
export interface ImportResult {
  added: number;   // entradas nuevas persistidas
  skipped: number; // omitidas por id ya existente
}

// Lee TODA la BD y retorna el string JSON del respaldo.
export function exportAllEntries(): Promise<string>;

// Atómica: valida todo antes de escribir; omite ids existentes;
// bulkAdd de las nuevas. Lanza RepositoryError tipado.
export function importBackupEntries(entries: TimeEntry[]): Promise<ImportResult>;
```

```ts
// src/core/errors.ts (ampliación)
export type RepositoryErrorCode =
  | 'QUOTA_EXCEEDED' | 'DB_UNAVAILABLE' | 'VALIDATION' | 'UNKNOWN'
  | 'BACKUP_INVALID' | 'BACKUP_TOO_LARGE';
```

```ts
// src/hooks/useBackup.ts
export interface UseBackup {
  exporting: boolean;
  importing: boolean;
  lastImportResult: ImportResult | null;
  error: RepositoryErrorCode | null;
  // Descarga el archivo; resuelve { ok } | { ok: false, code } (nunca reject).
  exportData: () => Promise<{ ok: true } | { ok: false; code: RepositoryErrorCode }>;
  // Lee el File, parsea, importa; dispara onImported en éxito.
  importFile: (file: File, onImported?: () => void) => Promise<
    { ok: true; result: ImportResult } | { ok: false; code: RepositoryErrorCode }
  >;
}
export function useBackup(): UseBackup;
```

```ts
// src/components/DataTransferButtons.tsx (presentación)
export interface DataTransferButtonsProps {
  onExport: () => Promise<{ ok: boolean } | { ok: false; code: string }>;
  onImport: (file: File) => void;
  importing: boolean;
  importSummary: string | null;  // ej. "Importadas: 5 · Omitidas: 2"
}
```

**Garantías del contrato**:
- Exportación con 0 entradas ⇒ archivo JSON válido con `entries: []`.
- Importación ⇒ `added + skipped ≤ entradas del archivo` y nunca se
  modifican/borran filas existentes.
- Errores siempre como `RepositoryErrorCode`; la UI traduce a español.
