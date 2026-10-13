import { useEffect, useState, type FormEvent } from 'react';
import { DURATION_VALUES, type Category, type DurationValue } from '../core/types';
import type { RepositoryErrorCode } from '../core/errors';
import type { EditTimeEntryInput } from '../core/time-entry.repo';
import type { TimeEntry } from '../core/types';
import { CATEGORY_LABELS } from './categoryLabels';
import { Button } from './ui/Button';
import { cn } from './ui/cn';

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
        <legend className="mb-1 text-sm font-medium text-foreground">Categoría</legend>
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
              className={cn(
                'rounded-lg px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
                category === value
                  ? value === 'WORK'
                    ? 'bg-work text-background'
                    : 'bg-learning text-background'
                  : 'border border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        Descripción
        <input
          type="text"
          value={description}
          maxLength={200}
          onChange={(event) => {
            setDescription(event.target.value);
            setValidationMessage(null);
          }}
          className="rounded-lg border border-border bg-card px-2 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Duración (minutos)</legend>
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
              className={cn(
                'rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
                timeValue === value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {value} min
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          Guardar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {validationMessage !== null && (
        <p role="alert" className="text-sm text-alert">
          {validationMessage}
        </p>
      )}
      {toast !== null && (
        <p role="status" className="text-sm text-alert">
          {toast}
        </p>
      )}
    </form>
  );
}
