import type { RepositoryErrorCode } from '../core/errors';
import type { EditTimeEntryInput } from '../core/time-entry.repo';
import type { Category, TimeEntry } from '../core/types';
import { CATEGORY_LABELS } from './categoryLabels';
import EntryList from './EntryList';
import { cn } from './ui/cn';

export interface CategoryCardProps {
  category: Category;
  total: number;
  entries: TimeEntry[];
  loading?: boolean;
  onRemove?: (id: string) => Promise<{ ok: true } | { ok: false; code: RepositoryErrorCode }>;
  onReplace?: (input: EditTimeEntryInput) => Promise<
    { ok: true } | { ok: false; code: RepositoryErrorCode }
  >;
}

const TINT: Record<Category, string> = {
  WORK: 'tint-work',
  LEARNING: 'tint-learning',
};

const ACCENT_TEXT: Record<Category, string> = {
  WORK: 'text-work',
  LEARNING: 'text-learning',
};

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return `${new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(hours)} h`;
}

export default function CategoryCard({
  category,
  total,
  entries,
  loading = false,
  onRemove,
  onReplace,
}: CategoryCardProps) {
  return (
    <section
      aria-label={`Tarjeta de ${CATEGORY_LABELS[category]}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <header
        data-testid="card-header"
        className={cn('flex items-end justify-between gap-3 px-4 pb-3 pt-4', TINT[category])}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Categoría
          </span>
          <h2 className={cn('font-serif text-2xl leading-none', ACCENT_TEXT[category])}>
            {CATEGORY_LABELS[category]}
          </h2>
        </div>
        <p
          data-testid="card-total"
          className="font-serif text-[60px] leading-none tabular-nums text-foreground"
        >
          {formatHours(total)}
        </p>
      </header>
      {loading ? (
        <EntryList entries={[]} loading />
      ) : entries.length === 0 ? (
        <p className="px-4 py-6 text-sm italic text-muted-foreground">
          Sin registros de {CATEGORY_LABELS[category]} este día
        </p>
      ) : (
        <EntryList entries={entries} loading={false} onRemove={onRemove} onReplace={onReplace} />
      )}
    </section>
  );
}
