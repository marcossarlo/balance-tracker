import { useState } from 'react';
import DayPicker from './components/DayPicker';
import EntryList from './components/EntryList';
import QuickEntryBar from './components/QuickEntryBar';
import SplitDashboard from './components/SplitDashboard';
import { getLocalToday } from './core/time-entry.repo';
import { useDailyBalance } from './hooks/useDailyBalance';
import { useTimeEntries } from './hooks/useTimeEntries';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const { entries, loading, save } = useTimeEntries(selectedDate);
  const { balance, loading: balanceLoading, refresh: refreshBalance } =
    useDailyBalance(selectedDate);

  async function handleSave(input: Parameters<typeof save>[0]) {
    const result = await save(input);
    if (result.ok) {
      refreshBalance();
    }
    return result;
  }

  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Balance Tracker</h1>
      <p className="mt-1 mb-2 text-sm text-gray-600">Trabajo / Aprendizaje</p>
      <DayPicker value={selectedDate} onChange={setSelectedDate} />
      <SplitDashboard balance={balance} loading={balanceLoading} />
      <div className="mt-4">
        {selectedDate === getLocalToday() && <QuickEntryBar onSave={handleSave} />}
      </div>
      <EntryList entries={entries} loading={loading} />
    </main>
  );
}
