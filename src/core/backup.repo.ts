import { db } from './db';
import { assertValidTimeEntry, serializeBackupFile, type BackupFile } from './backup-file';
import { mapIndexedDbError } from './errors';

export interface ImportResult {
  added: number;
  skipped: number;
}

export async function exportAllEntries(): Promise<string> {
  try {
    const entries = await db.timeEntries.toArray();
    return serializeBackupFile(entries);
  } catch (error) {
    throw mapIndexedDbError(error);
  }
}

export async function importBackupEntries(
  entries: BackupFile['entries'],
): Promise<ImportResult> {
  const ids = entries.map((entry) => entry.id);

  let existingIds: Set<string>;
  try {
    const existing = await db.timeEntries.bulkGet(ids);
    existingIds = new Set(
      existing.filter((row): row is NonNullable<typeof row> => row !== undefined).map((row) => row.id),
    );
  } catch (error) {
    throw mapIndexedDbError(error);
  }

  const fresh = entries.filter((entry) => !existingIds.has(entry.id));

  for (const entry of fresh) {
    assertValidTimeEntry(entry);
  }

  if (fresh.length > 0) {
    try {
      await db.timeEntries.bulkAdd(fresh);
    } catch (error) {
      throw mapIndexedDbError(error);
    }
  }

  return { added: fresh.length, skipped: entries.length - fresh.length };
}
