import { useCallback, useState } from 'react';
import { exportAllEntries, importBackupEntries, type ImportResult } from '../core/backup.repo';
import { buildBackupFileName, parseBackupFile } from '../core/backup-file';
import { toRepositoryErrorCode, type RepositoryErrorCode } from '../core/errors';
import { getLocalToday } from '../core/time-entry.repo';

export type ExportOutcome = { ok: true } | { ok: false; code: RepositoryErrorCode };
export type ImportOutcome =
  | { ok: true; result: ImportResult }
  | { ok: false; code: RepositoryErrorCode };

export interface UseBackup {
  exporting: boolean;
  importing: boolean;
  lastImportResult: ImportResult | null;
  error: RepositoryErrorCode | null;
  exportData: () => Promise<ExportOutcome>;
  importFile: (file: File, onImported?: () => void) => Promise<ImportOutcome>;
}

function triggerDownload(text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildBackupFileName(getLocalToday());
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useBackup(): UseBackup {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<RepositoryErrorCode | null>(null);

  const exportData = useCallback(async (): Promise<ExportOutcome> => {
    setExporting(true);
    try {
      const text = await exportAllEntries();
      triggerDownload(text);
      setError(null);
      return { ok: true };
    } catch (err) {
      const code = toRepositoryErrorCode(err);
      setError(code);
      return { ok: false, code };
    } finally {
      setExporting(false);
    }
  }, []);

  const importFile = useCallback(
    async (file: File, onImported?: () => void): Promise<ImportOutcome> => {
      setImporting(true);
      try {
        const text = await file.text();
        const backup = parseBackupFile(text);
        const result = await importBackupEntries(backup.entries);
        setLastImportResult(result);
        setError(null);
        onImported?.();
        return { ok: true, result };
      } catch (err) {
        const code = toRepositoryErrorCode(err);
        setError(code);
        return { ok: false, code };
      } finally {
        setImporting(false);
      }
    },
    [],
  );

  return { exporting, importing, lastImportResult, error, exportData, importFile };
}
