import type { ReactNode } from 'react';
import DataTransferButtons from './DataTransferButtons';
import DayNav from './DayNav';
import type { ImportResult } from '../core/backup.repo';
import type { RepositoryErrorCode } from '../core/errors';
import { cn } from './ui/cn';

export interface AppHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onExport: () => Promise<{ ok: boolean } | { ok: false; code: RepositoryErrorCode }>;
  onImport: (file: File) => void;
  exporting?: boolean;
  importing?: boolean;
  importSummary: ImportResult | null;
  themeToggle?: ReactNode;
}

function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

function formatWeekday(isoDate: string): string {
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(
    new Date(`${isoDate}T12:00:00`),
  );
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export default function AppHeader({
  selectedDate,
  onDateChange,
  onExport,
  onImport,
  exporting = false,
  importing = false,
  importSummary,
  themeToggle,
}: AppHeaderProps) {
  const today = new Date();
  const todayIso = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(today);
  const isToday = selectedDate === todayIso;

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            data-testid="eyebrow-pill"
            aria-hidden="true"
            className="inline-flex h-2 w-8 overflow-hidden rounded-full"
          >
            <span className="h-full w-1/2 bg-work" />
            <span className="h-full w-1/2 bg-learning" />
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Balance Tracker
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <h1
            className={cn(
              'font-serif text-4xl leading-none text-foreground lg:text-5xl',
              isToday ? '' : 'italic',
            )}
          >
            {isToday ? 'Hoy' : formatWeekday(selectedDate)}
          </h1>
          <span className="font-serif italic leading-none text-muted-foreground">
            {formatLongDate(selectedDate)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DayNav value={selectedDate} onChange={onDateChange} />
        <DataTransferButtons
          onExport={onExport}
          onImport={onImport}
          exporting={exporting}
          importing={importing}
          importSummary={importSummary}
        />
        {themeToggle}
      </div>
    </header>
  );
}
