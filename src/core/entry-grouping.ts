import type { TimeEntry } from './types';

export interface CategoryEntries {
  work: TimeEntry[];
  learning: TimeEntry[];
}

export function groupEntriesByCategory(entries: TimeEntry[]): CategoryEntries {
  const work: TimeEntry[] = [];
  const learning: TimeEntry[] = [];

  for (const entry of entries) {
    if (entry.category === 'WORK') {
      work.push(entry);
    } else {
      learning.push(entry);
    }
  }

  return { work, learning };
}
