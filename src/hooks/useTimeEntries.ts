import { useCallback, useEffect, useState } from 'react';
import { RepositoryError, type RepositoryErrorCode } from '../core/errors';
import {
  createTimeEntry,
  listEntriesByDate,
  type CreateTimeEntryInput,
} from '../core/time-entry.repo';
import type { TimeEntry } from '../core/types';

export type SaveResult =
  | { ok: true; entry: TimeEntry }
  | { ok: false; code: RepositoryErrorCode };

export interface UseTimeEntries {
  entries: TimeEntry[];
  loading: boolean;
  error: RepositoryErrorCode | null;
  refresh: () => void;
  save: (input: CreateTimeEntryInput) => Promise<SaveResult>;
}

function toCode(error: unknown): RepositoryErrorCode {
  return error instanceof RepositoryError ? error.code : 'UNKNOWN';
}

export function useTimeEntries(date: string): UseTimeEntries {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RepositoryErrorCode | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    listEntriesByDate(date)
      .then((result) => {
        setEntries(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(toCode(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: CreateTimeEntryInput): Promise<SaveResult> => {
      try {
        const entry = await createTimeEntry(input);
        refresh();
        return { ok: true, entry };
      } catch (err) {
        return { ok: false, code: toCode(err) };
      }
    },
    [refresh],
  );

  return { entries, loading, error, refresh, save };
}
