import { useEffect, useState, type FormEvent } from 'react';
import { DURATION_VALUES, type Category, type DurationValue } from '../core/types';
import type { RepositoryErrorCode } from '../core/errors';
import type { EditTimeEntryInput } from '../core/time-entry.repo';
import type { TimeEntry } from '../core/types';
import { CATEGORY_LABELS } from './categoryLabels';

export interface EditEntryFormProps {
  entry: TimeEntry;
  onReplace: (input: EditTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
  onCancel: () => void;
}

const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  QUOTA_EXCEEDED: 'No hay espacio disponible para guardar. Libera espacio e inténtalo de nuevo.',
  DB_UNAVAILABLE: 'No se puede acceder al almacenamiento. Inténtalo de nuevo.',
  VALIDATION: 'No se pudo editar: la entrada ya no existe o los datos son inválidos.',
  BACKUP_INVALID: 'No se pudo editar: datos inválidos.',
  BACKUP_TOO_LARGE: 'No se pudo editar: datos inválidos.',
  UNKNOWN: 'No se pudo editar. Inténtalo de nuevo.',
};

export default function EditEntryForm({ entry, onReplace, onCancel }: EditEntryFormProps) {
  const [category, setCategory] = useState<Category>(entry.category);
  const [description, setDescription] = useState(entry.description);
  const [timeValue, setTimeValue] = useState<DurationValue>(entry.timeValue);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (description.trim().length === 0) {
      setValidationMessage('Falta la descripción.');
      return;
    }

    setValidationMessage(null);
    setSaving(true);
    try {
      const result = await onReplace({
        id: entry.id,
        category,
        description,
        timeValue,
      });
      if (!result.ok) {
        setToast(ERROR_MESSAGES[result.code]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      aria-label="Editar entrada"
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-1 flex-col gap-3"
    >
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-gray-700">Categoría</legend>
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => {
                setCategory(value);
                setValidationMessage(null);
              }}
              className={
                value === 'WORK'
                  ? `rounded px-3 py-1 text-sm font-semibold text-white ${
                      category === value ? 'bg-blue-800' : 'bg-blue-600'
                    }`
                  : `rounded px-3 py-1 text-sm font-semibold text-white ${
                      category === value ? 'bg-amber-800' : 'bg-amber-600'
                    }`
              }
            >
              {CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Descripción
        <input
          type="text"
          value={description}
          maxLength={200}
          onChange={(event) => {
            setDescription(event.target.value);
            setValidationMessage(null);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-gray-900"
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-gray-700">Duración (minutos)</legend>
        <div className="flex flex-wrap gap-2">
          {DURATION_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={timeValue === value}
              onClick={() => {
                setTimeValue(value);
                setValidationMessage(null);
              }}
              className={`rounded border px-3 py-1 text-sm ${
                timeValue === value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              {value} min
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          Cancelar
        </button>
      </div>

      {validationMessage !== null && (
        <p role="alert" className="text-sm text-red-700">
          {validationMessage}
        </p>
      )}
      {toast !== null && (
        <p role="status" className="text-sm text-red-700">
          {toast}
        </p>
      )}
    </form>
  );
}
