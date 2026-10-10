import { useCallback, useEffect, useState } from 'react';
import { RepositoryError, type RepositoryErrorCode } from '../core/errors';
import { getLocalToday, getWeeklyTrends } from '../core/time-entry.repo';
import type { WeeklyTrendPoint } from '../core/types';

export interface UseWeeklyTrends {
  points: WeeklyTrendPoint[];
  loading: boolean;
  error: RepositoryErrorCode | null;
  refresh: () => void;
}

function toCode(error: unknown): RepositoryErrorCode {
  return error instanceof RepositoryError ? error.code : 'UNKNOWN';
}

export function useWeeklyTrends(endDate: string = getLocalToday()): UseWeeklyTrends {
  const [points, setPoints] = useState<WeeklyTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RepositoryErrorCode | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    getWeeklyTrends(endDate)
      .then((result) => {
        setPoints(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(toCode(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { points, loading, error, refresh };
}
