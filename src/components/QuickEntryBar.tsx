import { useEffect, useState, type FormEvent } from 'react';
import { DURATION_VALUES, type Category, type DurationValue } from '../core/types';
import type { RepositoryErrorCode } from '../core/errors';
import type { CreateTimeEntryInput } from '../core/time-entry.repo';

export interface QuickEntryBarProps {
  onSave: (input: CreateTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
}

const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  QUOTA_EXCEEDED: 'No hay espacio disponible para guardar. Libera espacio e inténtalo de nuevo.',
  DB_UNAVAILABLE: 'No se puede acceder al almacenamiento. Inténtalo de nuevo.',
  VALIDATION: 'Revisa los datos: la descripción debe tener entre 1 y 200 caracteres.',
  UNKNOWN: 'No se pudo guardar. Inténtalo de nuevo.',
};

const CATEGORY_LABELS: Record<Category, string> = {
  WORK: 'Trabajo',
  LEARNING: 'Aprendizaje',
};

export default function QuickEntryBar({ onSave }: QuickEntryBarProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [timeValue, setTimeValue] = useState<DurationValue | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (category === null) {
      setValidationMessage('Falta seleccionar una categoría.');
      return;
    }
    if (description.trim().length === 0) {
      setValidationMessage('Falta la descripción.');
      return;
    }
    if (timeValue === null) {
      setValidationMessage('Falta seleccionar la duración.');
      return;
    }

    setValidationMessage(null);
    const result = await onSave({ category, description, timeValue });

    if (result.ok) {
      setCategory(null);
      setDescription('');
      setTimeValue(null);
      return;
    }
    setToast(ERROR_MESSAGES[result.code]);
  }

  return (
    <section aria-label="Registro rápido" className="rounded-lg bg-white p-4 shadow">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
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
            placeholder="¿En qué dedicaste el tiempo?"
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

        <button
          type="submit"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Guardar
        </button>
      </form>

      {validationMessage !== null && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {validationMessage}
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
