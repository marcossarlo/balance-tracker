import type { Category } from '../core/types';
import { CATEGORY_LABELS } from './categoryLabels';
import { cn } from './ui/cn';

export interface CategorySelectorProps {
  value: Category | null;
  onChange: (category: Category) => void;
}

const CATEGORIES: Category[] = ['WORK', 'LEARNING'];

const CATEGORY_TOKEN: Record<Category, string> = {
  WORK: 'bg-work text-background',
  LEARNING: 'bg-learning text-background',
};

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Categoría"
      className="inline-flex gap-1 rounded-xl border border-border bg-muted p-1"
    >
      {CATEGORIES.map((category) => {
        const selected = value === category;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category)}
            className={cn(
              'rounded-lg px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              selected ? CATEGORY_TOKEN[category] : 'text-muted-foreground hover:bg-card',
            )}
          >
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
