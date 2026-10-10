import EntryList from './components/EntryList';
import QuickEntryBar from './components/QuickEntryBar';
import { getLocalToday } from './core/time-entry.repo';
import { useTimeEntries } from './hooks/useTimeEntries';

export default function App() {
  const today = getLocalToday();
  const { entries, loading, save } = useTimeEntries(today);

  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Balance Tracker</h1>
      <p className="mt-1 mb-4 text-sm text-gray-600">Trabajo / Aprendizaje — {today}</p>
      <QuickEntryBar onSave={save} />
      <EntryList entries={entries} loading={loading} />
    </main>
  );
}
