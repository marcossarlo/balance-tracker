export type Category = 'WORK' | 'LEARNING';

export const DURATION_VALUES = [15, 30, 60, 120, 180, 240] as const;
export type DurationValue = (typeof DURATION_VALUES)[number];

export interface TimeEntry {
  id: string;
  category: Category;
  description: string;
  timeValue: DurationValue;
  date: string;
  timestampCreation: number;
}

export interface DailyBalance {
  work: number;
  learning: number;
  total: number;
}

export interface WeeklyTrendPoint {
  date: string;
  label: string;
  work: number;
  learning: number;
}
