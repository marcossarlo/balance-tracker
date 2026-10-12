import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { RepositoryErrorCode } from '../core/errors';
import type { EditTimeEntryInput } from '../core/time-entry.repo';
import type { TimeEntry } from '../core/types';
import EditEntryForm from './EditEntryForm';

export interface EntryListProps {
  entries: TimeEntry[];
  loading: boolean;
  onRemove?: (id: string) => Promise<{ ok: true } | { ok: false; code: RepositoryErrorCode }>;
  onReplace?: (input: EditTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
}

const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  QUOTA_EXCEEDED: 'No se pudo eliminar por un problema de almacenamiento.',
  DB_UNAVAILABLE: 'No se puede acceder al almacenamiento. Inténtalo de nuevo.',
  VALIDATION: 'No se pudo eliminar: datos inválidos.',
  BACKUP_INVALID: 'No se pudo eliminar: datos inválidos.',
  BACKUP_TOO_LARGE: 'No se pudo eliminar: datos inválidos.',
  UNKNOWN: 'No se pudo eliminar. Inténtalo de nuevo.',
};

export default function EntryList({ entries, loading, onRemove, onReplace }: EntryListProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleRemove(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar esta entrada? Esta acción no se puede deshacer.')) {
      return;
    }
    if (!onRemove) return;
    const result = await onRemove(id);
    if (!result.ok) {
      setToast(ERROR_MESSAGES[result.code]);
    }
  }

  async function handleReplace(input: EditTimeEntryInput): Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  > {
    if (!onReplace) return { ok: false, code: 'UNKNOWN' };
    const result = await onReplace(input);
    if (result.ok) {
      setEditingId(null);
    }
    return result;
  }

  if (loading) {
    return <p className="py-3 text-sm text-muted-foreground">Cargando…</p>;
  }
  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <li key={entry.id} className="px-4 py-3">
              <EditEntryForm
                entry={entry}
                onReplace={handleReplace}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {entry.description}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {entry.timeValue} min
              </span>
              {onReplace && (
                <button
                  type="button"
                  aria-label="Editar"
                  onClick={() => setEditingId(entry.id)}
                  className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() => void handleRemove(entry.id)}
                className="inline-flex size-7 items-center justify-center rounded-sm text-alert hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </li>
          ),
        )}
      </ul>
      {toast !== null && (
        <p role="status" className="px-4 py-2 text-sm text-alert">
          {toast}
        </p>
      )}
    </>
  );
}
