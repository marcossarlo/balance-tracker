import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeGrowthSeries } from '../core/weekly-trends';
import type { WeeklyTrendPoint } from '../core/types';
import { cn } from './ui/cn';

export interface WeeklyTrendsProps {
  points: WeeklyTrendPoint[];
  loading: boolean;
}

type TrendTab = 'hours' | 'growth';

const WORK_COLOR = 'var(--work)';
const LEARNING_COLOR = 'var(--learning)';

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  color: 'var(--foreground)',
  fontSize: 12,
};

export default function WeeklyTrends({ points, loading }: WeeklyTrendsProps) {
  const [tab, setTab] = useState<TrendTab>('hours');

  if (loading) {
    return <p className="text-sm text-muted-foreground">Calculando tendencia…</p>;
  }

  const totalWork = points.reduce((sum, point) => sum + point.work, 0);
  const totalLearning = points.reduce((sum, point) => sum + point.learning, 0);
  const growthSeries = computeGrowthSeries(points);

  const description =
    totalWork + totalLearning === 0
      ? 'Sin registros en los últimos 7 días.'
      : totalWork > totalLearning
        ? 'Los últimos 7 días se inclinan hacia la operación.'
        : totalLearning > totalWork
          ? 'Los últimos 7 días se inclinan hacia el crecimiento.'
          : 'Los últimos 7 días están equilibrados.';

  return (
    <section aria-label="Balance Semanal" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-3xl leading-tight text-foreground">Balance Semanal</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <dl className="flex items-end gap-6" role="group" aria-label="Totales semanales">
          <div className="flex flex-col items-end">
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">Trabajo</dt>
            <dd className="font-serif text-3xl leading-none tabular-nums text-work">
              {totalWork} min
            </dd>
          </div>
          <div className="flex flex-col items-end">
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">
              Aprendizaje
            </dt>
            <dd className="font-serif text-3xl leading-none tabular-nums text-learning">
              {totalLearning} min
            </dd>
          </div>
        </dl>
      </div>

      <div
        role="tablist"
        aria-label="Modo de tendencia"
        className="inline-flex w-fit gap-1 rounded-xl border border-border bg-muted p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'hours'}
          onClick={() => setTab('hours')}
          className={cn(
            'rounded-lg px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
            tab === 'hours' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
          )}
        >
          Horas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'growth'}
          onClick={() => setTab('growth')}
          className={cn(
            'rounded-lg px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
            tab === 'growth' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
          )}
        >
          % Crecimiento
        </button>
      </div>

      <div role="tabpanel" aria-label={tab === 'hours' ? 'Horas' : '% Crecimiento'} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'hours' ? (
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="work"
                name="Trabajo"
                stroke={WORK_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3, fill: WORK_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="learning"
                name="Aprendizaje"
                stroke={LEARNING_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3, fill: LEARNING_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          ) : (
            <LineChart data={growthSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: 'var(--muted-foreground)' }}
                formatter={(value) => [`${value}%`, 'Crecimiento']}
              />
              <Line
                type="monotone"
                dataKey="growth"
                name="Crecimiento"
                stroke={LEARNING_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3, fill: LEARNING_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div data-testid="trends-legend" className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span data-testid="legend-swatch" className="inline-block h-0.5 w-6 rounded-full bg-work" />
          Trabajo
        </span>
        <span className="inline-flex items-center gap-2">
          <span data-testid="legend-swatch" className="inline-block h-0.5 w-6 rounded-full bg-learning" />
          Aprendizaje
        </span>
      </div>
    </section>
  );
}
