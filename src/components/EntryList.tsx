import { useEffect, useState } from 'react';
import type { RepositoryErrorCode } from '../core/errors';
import type { EditTimeEntryInput } from '../core/time-entry.repo';
import type { TimeEntry } from '../core/types';
import EditEntryForm from './EditEntryForm';
import { CATEGORY_LABELS } from './categoryLabels';

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
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">Sin registros este día</p>;
  }

  return (
    <section aria-label="Entradas del día" className="mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Entradas del día</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <li
              key={entry.id}
              className="rounded bg-white px-3 py-2 shadow"
            >
              <EditEntryForm
                entry={entry}
                onReplace={handleReplace}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded bg-white px-3 py-2 shadow"
            >
              <span
                className={
                  entry.category === 'WORK'
                    ? 'text-sm font-semibold text-blue-800'
                    : 'text-sm font-semibold text-amber-800'
                }
              >
                {CATEGORY_LABELS[entry.category]}
              </span>
              <span className="flex-1 px-3 text-sm text-gray-700">{entry.description}</span>
              <span className="text-sm text-gray-500">{entry.timeValue} min</span>
              {onReplace && (
                <button
                  type="button"
                  onClick={() => setEditingId(entry.id)}
                  className="ml-2 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"
                >
                  Editar
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleRemove(entry.id)}
                className="ml-2 rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700"
              >
                Eliminar
              </button>
            </li>
          ),
        )}
      </ul>
      {toast !== null && (
        <p role="status" className="mt-2 text-sm text-red-700">
          {toast}
        </p>
      )}
    </section>
  );
}
