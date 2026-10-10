import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeeklyTrendPoint } from '../core/types';

export interface WeeklyTrendsProps {
  points: WeeklyTrendPoint[];
  loading: boolean;
}

const WORK_COLOR = '#1e40af';
const LEARNING_COLOR = '#b45309';

export default function WeeklyTrends({ points, loading }: WeeklyTrendsProps) {
  if (loading) {
    return <p className="text-sm text-gray-500">Calculando tendencia…</p>;
  }

  return (
    <section aria-label="Balance Semanal" className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900">Balance Semanal</h2>
      <div className="mt-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis unit=" min" width={70} />
            <Tooltip />
            <Legend />
            <Bar dataKey="work" name="Trabajo" fill={WORK_COLOR} />
            <Bar dataKey="learning" name="Aprendizaje" fill={LEARNING_COLOR} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
