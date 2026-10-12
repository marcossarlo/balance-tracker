import { useEffect, useState, type FormEvent } from 'react';
import { CornerDownLeft } from 'lucide-react';
import type { Category, DurationValue } from '../core/types';
import type { RepositoryErrorCode } from '../core/errors';
import type { CreateTimeEntryInput } from '../core/time-entry.repo';
import CategorySelector from './CategorySelector';
import { Button } from './ui/Button';
import { cn } from './ui/cn';

export interface QuickEntryBarProps {
  onSave: (input: CreateTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
}

const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  QUOTA_EXCEEDED: 'No hay espacio disponible para guardar. Libera espacio e inténtalo de nuevo.',
  DB_UNAVAILABLE: 'No se puede acceder al almacenamiento. Inténtalo de nuevo.',
  VALIDATION: 'Revisa los datos: la descripción debe tener entre 1 y 200 caracteres.',
  BACKUP_INVALID: 'No se pudo guardar: archivo de respaldo inválido.',
  BACKUP_TOO_LARGE: 'No se pudo guardar: el archivo de respaldo es demasiado grande.',
  UNKNOWN: 'No se pudo guardar. Inténtalo de nuevo.',
};

const QUICK_DURATIONS: { value: DurationValue; label: string }[] = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
];

const PILL_TINT: Record<Category, string> = {
  WORK: 'bg-work text-background',
  LEARNING: 'bg-learning text-background',
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
    <section aria-label="Registro rápido" className="sticky top-3 z-10">
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <label className="min-w-48 flex-1">
              <span className="sr-only">Descripción</span>
              <input
                type="text"
                value={description}
                maxLength={200}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setValidationMessage(null);
                }}
                placeholder="¿En qué invertiste tu tiempo?"
                className="w-full border-none bg-transparent p-0 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </label>
            <CategorySelector
              value={category}
              onChange={(next) => {
                setCategory(next);
                setValidationMessage(null);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
            <div
              role="group"
              aria-label="Duración rápida"
              className="flex flex-wrap items-center gap-1"
            >
              {QUICK_DURATIONS.map(({ value, label }) => {
                const selected = timeValue === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setTimeValue(value);
                      setValidationMessage(null);
                    }}
                    className={cn(
                      'rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
                      category !== null
                        ? cn(PILL_TINT[category], selected ? '' : 'opacity-55')
                        : selected
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Button type="submit">
              Registrar
              <CornerDownLeft size={14} aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>
      {validationMessage !== null && (
        <p role="alert" className="mt-2 text-sm text-alert">
          {validationMessage}
        </p>
      )}
      {toast !== null && (
        <p role="status" className="mt-2 text-sm text-alert">
          {toast}
        </p>
      )}
    </section>
  );
}
