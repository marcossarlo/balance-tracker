import { useEffect, useRef, useState } from 'react';
import type { RepositoryErrorCode } from '../core/errors';
import type { ImportResult } from '../core/backup.repo';

export interface DataTransferButtonsProps {
  onExport: () => Promise<{ ok: boolean } | { ok: false; code: RepositoryErrorCode }>;
  onImport: (file: File) => void;
  exporting?: boolean;
  importing?: boolean;
  importSummary: ImportResult | null;
}

const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  QUOTA_EXCEEDED: 'No hay espacio disponible para descargar o importar. Libera espacio e inténtalo de nuevo.',
  DB_UNAVAILABLE: 'No se puede acceder al almacenamiento. Inténtalo de nuevo.',
  VALIDATION: 'Revisa los datos antes de importar. Ningún cambio se guardó.',
  BACKUP_INVALID: 'El archivo no es un respaldo válido de Balance Tracker. Elige otro archivo.',
  BACKUP_TOO_LARGE: 'El archivo es demasiado grande para importarlo (máximo 10 MB).',
  UNKNOWN: 'No se pudo completar la operación. Inténtalo de nuevo.',
};

export default function DataTransferButtons({
  onExport,
  onImport,
  exporting = false,
  importing = false,
  importSummary,
}: DataTransferButtonsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const busy = exporting || importing;

  async function handleExport(): Promise<void> {
    const result = await onExport();
    if (!result.ok && 'code' in result) {
      setToast(ERROR_MESSAGES[result.code]);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      onImport(file);
    }
  }

  return (
    <section aria-label="Respaldo de datos" className="mt-4 rounded-lg bg-white p-4 shadow">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Respaldo</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={busy}
          className="rounded bg-gray-900 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
        >
          {exporting ? 'Exportando…' : 'Exportar datos'}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          {importing ? 'Importando…' : 'Importar datos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Archivo de respaldo"
          onChange={handleFileChange}
        />
      </div>
      {importSummary !== null && (
        <p role="status" className="mt-2 text-sm text-green-800">
          Importadas: {importSummary.added} · Omitidas: {importSummary.skipped}
        </p>
      )}
      {toast !== null && (
        <p role="status" className="mt-2 text-sm text-red-700">
          {toast}
        </p>
      )}
    </section>
  );
}
