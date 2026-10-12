import { useState } from 'react';
import AppHeader from './components/AppHeader';
import BalanceMeter from './components/BalanceMeter';
import CategoryCard from './components/CategoryCard';
import QuickEntryBar from './components/QuickEntryBar';
import WeeklyTrends from './components/WeeklyTrends';
import ThemeToggle from './components/ThemeToggle';
import { groupEntriesByCategory } from './core/entry-grouping';
import { getLocalToday } from './core/time-entry.repo';
import { useBackup } from './hooks/useBackup';
import { useDailyBalance } from './hooks/useDailyBalance';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useWeeklyTrends } from './hooks/useWeeklyTrends';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const { entries, loading, save, remove, replace, refresh: refreshEntries } =
    useTimeEntries(selectedDate);
  const { balance, refresh: refreshBalance } = useDailyBalance(selectedDate);
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

  const grouped = groupEntriesByCategory(entries);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6">
      <AppHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onExport={exportData}
        onImport={(file) => void importFile(file, handleImported)}
        exporting={exporting}
        importing={importing}
        importSummary={lastImportResult}
        themeToggle={<ThemeToggle />}
      />
      <BalanceMeter balance={balance} />
      <div>
        {selectedDate === getLocalToday() && <QuickEntryBar onSave={handleSave} />}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CategoryCard
          category="WORK"
          total={balance.work}
          entries={grouped.work}
          loading={loading}
          onRemove={handleRemove}
          onReplace={handleReplace}
        />
        <CategoryCard
          category="LEARNING"
          total={balance.learning}
          entries={grouped.learning}
          loading={loading}
          onRemove={handleRemove}
          onReplace={handleReplace}
        />
      </div>
      <WeeklyTrends points={points} loading={trendsLoading} />
      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        Balance Tracker · Registro local de tiempo Trabajo / Aprendizaje
      </footer>
    </main>
  );
}
