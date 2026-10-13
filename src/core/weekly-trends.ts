import type { TimeEntry, WeeklyTrendPoint } from './types';

export const WEEK_LENGTH = 7;

function parseIsoDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, deltaDays: number): string {
  const date_ = parseIsoDate(date);
  date_.setUTCDate(date_.getUTCDate() + deltaDays);
  return toIsoDate(date_);
}

export function buildWeekDates(endDate: string): string[] {
  return Array.from({ length: WEEK_LENGTH }, (_, index) =>
    addDays(endDate, index - (WEEK_LENGTH - 1)),
  );
}

function formatLabel(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

export function computeWeeklyTrends(
  entries: TimeEntry[],
  weekDates: string[],
): WeeklyTrendPoint[] {
  const totals = new Map<string, { work: number; learning: number }>(
    weekDates.map((date) => [date, { work: 0, learning: 0 }]),
  );

  for (const entry of entries) {
    const day = totals.get(entry.date);
    if (!day) continue;
    if (entry.category === 'WORK') {
      day.work += entry.timeValue;
    } else {
      day.learning += entry.timeValue;
    }
  }

  return weekDates.map((date) => ({
    date,
    label: formatLabel(date),
    work: totals.get(date)!.work,
    learning: totals.get(date)!.learning,
  }));
}

export interface GrowthPoint {
  date: string;
  label: string;
  growth: number;
}

export function computeGrowthSeries(points: WeeklyTrendPoint[]): GrowthPoint[] {
  return points.map((point) => {
    const total = point.work + point.learning;
    const growth = total > 0 ? Math.round((point.learning / total) * 100) : 0;
    return { date: point.date, label: point.label, growth };
  });
}
