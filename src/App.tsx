import { useState } from 'react';
import DataTransferButtons from './components/DataTransferButtons';
import DayPicker from './components/DayPicker';
import EntryList from './components/EntryList';
import QuickEntryBar from './components/QuickEntryBar';
import SplitDashboard from './components/SplitDashboard';
import WeeklyTrends from './components/WeeklyTrends';
import { getLocalToday } from './core/time-entry.repo';
import { useBackup } from './hooks/useBackup';
import { useDailyBalance } from './hooks/useDailyBalance';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useWeeklyTrends } from './hooks/useWeeklyTrends';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const { entries, loading, save, remove, replace, refresh: refreshEntries } =
    useTimeEntries(selectedDate);
  const { balance, loading: balanceLoading, refresh: refreshBalance } =
    useDailyBalance(selectedDate);
  const { points, loading: trendsLoading, refresh: refreshTrends } = useWeeklyTrends();
  const { exporting, importing, lastImportResult, exportData, importFile } = useBackup();

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

  async function handleReplace(input: Parameters<typeof replace>[0]) {
    const result = await replace(input);
    if (result.ok) {
      await refreshAll();
    }
    return result;
  }

  function handleImported() {
    refreshEntries();
    refreshBalance();
    refreshTrends();
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
      <EntryList
        entries={entries}
        loading={loading}
        onRemove={handleRemove}
        onReplace={handleReplace}
      />
      <WeeklyTrends points={points} loading={trendsLoading} />
      <DataTransferButtons
        onExport={exportData}
        onImport={(file) => void importFile(file, handleImported)}
        exporting={exporting}
        importing={importing}
        importSummary={lastImportResult}
      />
    </main>
  );
}
