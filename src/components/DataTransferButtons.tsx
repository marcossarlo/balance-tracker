import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { RepositoryErrorCode } from '../core/errors';
import type { ImportResult } from '../core/backup.repo';
import { Button } from './ui/Button';

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
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() => void handleExport()}
        disabled={busy}
        aria-label={exporting ? 'Exportando…' : 'Exportar datos'}
      >
        <Download size={14} aria-hidden="true" />
        {exporting ? 'Exportando…' : 'Exportar datos'}
      </Button>
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={importing ? 'Importando…' : 'Importar datos'}
      >
        <Upload size={14} aria-hidden="true" />
        {importing ? 'Importando…' : 'Importar datos'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Archivo de respaldo"
        onChange={handleFileChange}
      />
      {importSummary !== null && (
        <p role="status" className="text-sm text-foreground">
          Importadas: {importSummary.added} · Omitidas: {importSummary.skipped}
        </p>
      )}
      {toast !== null && (
        <p role="status" className="text-sm text-alert">
          {toast}
        </p>
      )}
    </div>
  );
}
