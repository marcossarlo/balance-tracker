import type { DailyBalance } from '../core/types';

export interface SplitDashboardProps {
  balance: DailyBalance;
  loading: boolean;
}

export default function SplitDashboard({ balance, loading }: SplitDashboardProps) {
  if (loading) {
    return <p className="text-sm text-gray-500">Calculando balance…</p>;
  }

  return (
    <section aria-label="Balance del día" className="mt-4 grid grid-cols-3 gap-2">
      <div className="rounded-lg bg-blue-800 p-4 text-center text-white">
        <p className="text-sm font-medium">Trabajo</p>
        <p className="text-2xl font-bold">{balance.work} min</p>
      </div>
      <div className="rounded-lg bg-amber-800 p-4 text-center text-white">
        <p className="text-sm font-medium">Aprendizaje</p>
        <p className="text-2xl font-bold">{balance.learning} min</p>
      </div>
      <div className="rounded-lg bg-gray-800 p-4 text-center text-white">
        <p className="text-sm font-medium">Total</p>
        <p className="text-2xl font-bold">{balance.total} min</p>
      </div>
    </section>
  );
}
