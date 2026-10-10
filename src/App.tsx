import { useState } from 'react';
import DayPicker from './components/DayPicker';
import EntryList from './components/EntryList';
import QuickEntryBar from './components/QuickEntryBar';
import SplitDashboard from './components/SplitDashboard';
import WeeklyTrends from './components/WeeklyTrends';
import { getLocalToday } from './core/time-entry.repo';
import { useDailyBalance } from './hooks/useDailyBalance';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useWeeklyTrends } from './hooks/useWeeklyTrends';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const { entries, loading, save, remove } = useTimeEntries(selectedDate);
  const { balance, loading: balanceLoading, refresh: refreshBalance } =
    useDailyBalance(selectedDate);
  const { points, loading: trendsLoading, refresh: refreshTrends } = useWeeklyTrends();

  async function refreshAll() {
    refreshBalance();
    refreshTrends();
  }

  async function handleSave(input: Parameters<typeof save>[0]) {
    const result = await save(input);
    if (result.ok) {
      await refreshAll();
    }
    return result;
  }

  async function handleRemove(id: string) {
    const result = await remove(id);
    if (result.ok) {
      await refreshAll();
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
      <EntryList entries={entries} loading={loading} onRemove={handleRemove} />
      <WeeklyTrends points={points} loading={trendsLoading} />
    </main>
  );
}
