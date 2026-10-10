import { BalanceTrackerDB } from '../../src/core/db';

let counter = 0;

export function createTestDb(): BalanceTrackerDB {
  counter += 1;
  return new BalanceTrackerDB(`test-balance-tracker-${counter}-${Date.now()}`);
}

export async function clearTestDb(testDb: BalanceTrackerDB): Promise<void> {
  await testDb.timeEntries.clear();
}
