import Dexie, { type EntityTable } from 'dexie';
import type { TimeEntry } from './types';

export class BalanceTrackerDB extends Dexie {
  timeEntries!: EntityTable<TimeEntry, 'id'>;

  constructor(name = 'balance-tracker') {
    super(name);
    this.version(1).stores({
      timeEntries: '&id, date, [date+category]',
    });
  }
}

export const db = new BalanceTrackerDB();
