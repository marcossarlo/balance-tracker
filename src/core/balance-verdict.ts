import type { DailyBalance } from './types';

export type BalanceVerdictTone =
  | 'empty'
  | 'balanced'
  | 'work-heavy'
  | 'work-extreme'
  | 'learning-heavy'
  | 'learning-extreme';

export interface BalanceVerdict {
  tone: BalanceVerdictTone;
  message: string;
  workPercent: number;
  learningPercent: number;
}

const MESSAGES: Record<BalanceVerdictTone, string> = {
  empty: 'Aún no hay registros hoy. Empieza cuando quieras.',
  balanced: 'Equilibrio saludable entre operación y crecimiento.',
  'work-heavy': 'La operación pesa más de la cuenta; recupera tiempo de crecimiento.',
  'work-extreme': 'Lo urgente está canibalizando tu tiempo de desarrollo.',
  'learning-heavy': 'El crecimiento avanza; revisa que la operación no se frene.',
  'learning-extreme': 'El crecimiento domina el día; la operación queda en pausa.',
};

export function computeBalanceVerdict(balance: DailyBalance): BalanceVerdict {
  const { work, learning, total } = balance;

  if (total === 0) {
    return {
      tone: 'empty',
      message: MESSAGES.empty,
      workPercent: 0,
      learningPercent: 0,
    };
  }

  const l = learning / total;
  let tone: BalanceVerdictTone;
  if (l < 0.25) {
    tone = 'work-extreme';
  } else if (l < 0.4) {
    tone = 'work-heavy';
  } else if (l <= 0.6) {
    tone = 'balanced';
  } else if (l <= 0.75) {
    tone = 'learning-heavy';
  } else {
    tone = 'learning-extreme';
  }

  const workPercent = Math.round((work / total) * 100);
  const learningPercent = 100 - workPercent;

  return { tone, message: MESSAGES[tone], workPercent, learningPercent };
}
