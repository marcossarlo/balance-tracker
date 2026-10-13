// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CategoryCard from '../../src/components/CategoryCard';
import type { TimeEntry } from '../../src/core/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const WORK_ENTRY: TimeEntry = {
  id: 'w1',
  category: 'WORK',
  description: 'Revisar correos',
  timeValue: 60,
  date: '2026-10-12',
  timestampCreation: 1,
};

const WORK_ENTRY_2: TimeEntry = {
  id: 'w2',
  category: 'WORK',
  description: 'Una descripción extremadamente larga que debe truncarse sin romper el layout de la tarjeta para que el diseño se mantenga estable',
  timeValue: 30,
  date: '2026-10-12',
  timestampCreation: 2,
};

describe('CategoryCard', () => {
  it('renders the tinted header with eyebrow and category name', () => {
    render(
      <CategoryCard
        category="WORK"
        total={90}
        entries={[WORK_ENTRY]}
        onRemove={vi.fn()}
        onReplace={vi.fn()}
      />,
    );
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    const header = screen.getByTestId('card-header');
    expect(header.className).toContain('tint-work');
  });

  it('shows the total hours in serif with tabular numbers', () => {
    render(
      <CategoryCard
        category="WORK"
        total={90}
        entries={[WORK_ENTRY]}
        onRemove={vi.fn()}
        onReplace={vi.fn()}
      />,
    );
    const total = screen.getByTestId('card-total');
    expect(total.textContent).toBe('1,5 h');
    expect(total.className).toContain('font-serif');
    expect(total.className).toContain('tabular-nums');
  });

  it('renders one compact row per entry', () => {
    render(
      <CategoryCard
        category="WORK"
        total={90}
        entries={[WORK_ENTRY, WORK_ENTRY_2]}
        onRemove={vi.fn()}
        onReplace={vi.fn()}
      />,
    );
    expect(screen.getByText('Revisar correos')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);
  });

  it('shows a dimmed empty state when there are no entries', () => {
    render(
      <CategoryCard
        category="LEARNING"
        total={0}
        entries={[]}
        onRemove={vi.fn()}
        onReplace={vi.fn()}
      />,
    );
    const empty = screen.getByText(/Sin registros de Aprendizaje/);
    expect(empty.className).toContain('text-muted-foreground');
  });

  it('truncates long descriptions without overflowing', () => {
    render(
      <CategoryCard
        category="WORK"
        total={30}
        entries={[WORK_ENTRY_2]}
        onRemove={vi.fn()}
        onReplace={vi.fn()}
      />,
    );
    const description = screen.getByText(/Una descripción extremadamente larga/);
    expect(description.className).toContain('truncate');
  });

  it('deletes an entry through the card row flow', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    function Harness() {
      const [entries, setEntries] = useState([WORK_ENTRY]);
      return (
        <CategoryCard
          category="WORK"
          total={60}
          entries={entries}
          onRemove={async (id) => {
            setEntries((current) => current.filter((e) => e.id !== id));
            return { ok: true } as const;
          }}
          onReplace={vi.fn()}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(screen.queryByText('Revisar correos')).toBeNull();
    });
  });
});
