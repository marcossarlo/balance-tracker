import { RepositoryError } from './errors';
import { assertValidEntryFields } from './entry-validation';
import type { TimeEntry } from './types';

export const BACKUP_APP = 'balance-tracker';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_TEXT_BYTES = 10 * 1024 * 1024;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  entries: TimeEntry[];
}

export function serializeBackupFile(entries: TimeEntry[], now: number = Date.now()): string {
  const backup: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now,
    entries,
  };
  return JSON.stringify(backup);
}

export function buildBackupFileName(dateIso: string): string {
  return `balance-tracker-${dateIso}.json`;
}

export function assertValidTimeEntry(value: unknown): asserts value is TimeEntry {
  if (typeof value !== 'object' || value === null) {
    throw new RepositoryError('VALIDATION', 'entry must be an object');
  }
  const entry = value as Partial<TimeEntry>;
  if (typeof entry.id !== 'string' || entry.id.length === 0) {
    throw new RepositoryError('VALIDATION', 'entry.id must be a non-empty string');
  }
  assertValidEntryFields({
    category: entry.category,
    description: entry.description,
    timeValue: entry.timeValue,
  });
  if (typeof entry.date !== 'string' || !DATE_RE.test(entry.date)) {
    throw new RepositoryError('VALIDATION', 'entry.date must be YYYY-MM-DD');
  }
  if (typeof entry.timestampCreation !== 'number') {
    throw new RepositoryError('VALIDATION', 'entry.timestampCreation must be a number');
  }
}

export function parseBackupFile(text: string): BackupFile {
  if (text.length > MAX_BACKUP_TEXT_BYTES) {
    throw new RepositoryError('BACKUP_TOO_LARGE', 'backup text exceeds size limit');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RepositoryError('BACKUP_INVALID', 'backup is not valid JSON');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new RepositoryError('BACKUP_INVALID', 'backup must be a JSON object');
  }

  const candidate = parsed as Partial<BackupFile>;
  if (candidate.app !== BACKUP_APP) {
    throw new RepositoryError('BACKUP_INVALID', 'unknown backup app marker');
  }
  if (candidate.version !== BACKUP_VERSION) {
    throw new RepositoryError('BACKUP_INVALID', 'unsupported backup version');
  }
  if (!Array.isArray(candidate.entries)) {
    throw new RepositoryError('BACKUP_INVALID', 'backup.entries must be an array');
  }
  if (typeof candidate.exportedAt !== 'number') {
    throw new RepositoryError('BACKUP_INVALID', 'backup.exportedAt must be a number');
  }

  for (const entry of candidate.entries) {
    try {
      assertValidTimeEntry(entry);
    } catch {
      throw new RepositoryError('BACKUP_INVALID', 'backup contains an invalid entry');
    }
  }

  return candidate as BackupFile;
}
