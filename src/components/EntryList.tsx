import type { TimeEntry } from '../core/types';

export interface EntryListProps {
  entries: TimeEntry[];
  loading: boolean;
}

const CATEGORY_LABELS: Record<TimeEntry['category'], string> = {
  WORK: 'Trabajo',
  LEARNING: 'Aprendizaje',
};

export default function EntryList({ entries, loading }: EntryListProps) {
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
        {entries.map((entry) => (
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
          </li>
        ))}
      </ul>
    </section>
  );
}
