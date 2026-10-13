import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays } from '../core/weekly-trends';
import { getLocalToday } from '../core/time-entry.repo';
import { Button } from './ui/Button';

export interface DayNavProps {
  value: string;
  onChange: (date: string) => void;
}

export default function DayNav({ value, onChange }: DayNavProps) {
  const isToday = value === getLocalToday();

  return (
    <nav aria-label="Navegación de días" className="inline-flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Día anterior"
        onClick={() => onChange(addDays(value, -1))}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        aria-label="Ir a hoy"
        disabled={isToday}
        onClick={() => onChange(getLocalToday())}
      >
        Hoy
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Día siguiente"
        onClick={() => onChange(addDays(value, 1))}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </nav>
  );
}
