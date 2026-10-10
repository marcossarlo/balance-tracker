import { db } from './db';
import { mapIndexedDbError, RepositoryError } from './errors';
import { DURATION_VALUES, type Category, type DailyBalance, type DurationValue, type TimeEntry } from './types';
import { computeDailyBalance } from './daily-balance';

export interface CreateTimeEntryInput {
  category: Category;
  description: string;
  timeValue: DurationValue;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function createTimeEntry(input: CreateTimeEntryInput): Promise<TimeEntry> {
  if (input.category !== 'WORK' && input.category !== 'LEARNING') {
    throw new RepositoryError('VALIDATION', 'category must be WORK or LEARNING');
  }
  if (!DURATION_VALUES.includes(input.timeValue)) {
    throw new RepositoryError('VALIDATION', 'timeValue must be in catalog');
  }
  const description = input.description.trim();
  if (description.length < 1 || description.length > 200) {
    throw new RepositoryError('VALIDATION', 'description must be 1..200 chars');
  }

  const entry: TimeEntry = {
    id: crypto.randomUUID(),
    category: input.category,
    description,
    timeValue: input.timeValue,
    date: getLocalToday(),
    timestampCreation: Date.now(),
  };

  try {
    await db.timeEntries.add(entry);
  } catch (error) {
    throw mapIndexedDbError(error);
  }
  return entry;
}

export async function listEntriesByDate(date: string): Promise<TimeEntry[]> {
  if (!DATE_RE.test(date)) {
    throw new RepositoryError('VALIDATION', 'date must be YYYY-MM-DD');
  }
  try {
    return await db.timeEntries.where('date').equals(date).toArray();
  } catch (error) {
    throw mapIndexedDbError(error);
  }
}

export async function getDailyBalance(date: string): Promise<DailyBalance> {
  const entries = await listEntriesByDate(date);
  return computeDailyBalance(entries, date);
}
