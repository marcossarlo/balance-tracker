import { useCallback, useEffect, useState } from 'react';
import { toRepositoryErrorCode as toCode, type RepositoryErrorCode } from '../core/errors';
import { getDailyBalance } from '../core/time-entry.repo';
import type { DailyBalance } from '../core/types';

const EMPTY_BALANCE: DailyBalance = { work: 0, learning: 0, total: 0 };

export interface UseDailyBalance {
  balance: DailyBalance;
  loading: boolean;
  error: RepositoryErrorCode | null;
  refresh: () => void;
}


export function useDailyBalance(date: string): UseDailyBalance {
  const [balance, setBalance] = useState<DailyBalance>(EMPTY_BALANCE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RepositoryErrorCode | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    getDailyBalance(date)
      .then((result) => {
        setBalance(result);
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

  return { balance, loading, error, refresh };
}
