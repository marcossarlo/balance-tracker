import { computeBalanceVerdict } from '../core/balance-verdict';
import type { DailyBalance } from '../core/types';

export interface BalanceMeterProps {
  balance: DailyBalance;
}

export default function BalanceMeter({ balance }: BalanceMeterProps) {
  const verdict = computeBalanceVerdict(balance);

  return (
    <section aria-label="Medidor de equilibrio" className="flex flex-col gap-4">
      <h2 className="max-w-3xl font-serif text-3xl leading-tight text-balance text-foreground lg:text-4xl">
        {verdict.message}
      </h2>
      <div
        role="meter"
        aria-label="Balance del día"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={verdict.learningPercent}
        className="relative h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          data-testid="meter-work"
          className="h-full bg-work transition-[width] duration-700"
          style={{ width: `${verdict.workPercent}%` }}
        />
        <div
          data-testid="meter-learning"
          className="h-full bg-learning transition-[width] duration-700"
          style={{ width: `${verdict.learningPercent}%` }}
        />
        <span
          data-testid="meter-center-mark"
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-background"
        />
      </div>
      <p data-testid="meter-percentages" className="flex items-center gap-2 text-sm">
        <span className="font-medium text-work">{verdict.workPercent}% operación</span>
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <span aria-hidden="true" className="text-muted-foreground">
          50/50
        </span>
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <span className="font-medium text-learning">{verdict.learningPercent}% crecimiento</span>
      </p>
    </section>
  );
}
