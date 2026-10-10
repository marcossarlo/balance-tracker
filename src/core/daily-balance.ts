import type { DailyBalance, TimeEntry } from './types';

export function computeDailyBalance(entries: TimeEntry[], date: string): DailyBalance {
  let work = 0;
  let learning = 0;

  for (const entry of entries) {
    if (entry.date !== date) continue;
    if (entry.category === 'WORK') {
      work += entry.timeValue;
    } else {
      learning += entry.timeValue;
    }
  }

  return { work, learning, total: work + learning };
}
