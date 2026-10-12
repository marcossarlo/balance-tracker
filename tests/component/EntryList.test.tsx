// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EntryList from '../../src/components/EntryList';
import type { EditTimeEntryInput } from '../../src/core/time-entry.repo';
import type { TimeEntry } from '../../src/core/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ENTRY: TimeEntry = {
  id: 'entry-1',
  category: 'WORK',
  description: 'Revisar correos',
  timeValue: 60,
  date: '2026-10-08',
  timestampCreation: 0,
};

function Harness({
  initialEntries,
  onRemove,
}: {
  initialEntries: TimeEntry[];
  onRemove: (id: string) => Promise<{ ok: true } | { ok: false; code: 'UNKNOWN' }>;
}) {
  const [entries, setEntries] = useState(initialEntries);
  return (
    <EntryList
      entries={entries}
      loading={false}
      onRemove={async (id) => {
        const result = await onRemove(id);
        if (result.ok) {
          setEntries((current) => current.filter((e) => e.id !== id));
        }
        return result;
      }}
    />
  );
}

describe('EntryList delete flow', () => {
  it('keeps the entry when confirm is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onRemove = vi.fn();
    render(<Harness initialEntries={[ENTRY]} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      '¿Eliminar esta entrada? Esta acción no se puede deshacer.',
    );
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByText('Revisar correos')).toBeInTheDocument();
  });

  it('removes the entry from the DOM when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onRemove = vi.fn().mockResolvedValue({ ok: true });
    render(<Harness initialEntries={[ENTRY]} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith('entry-1');
    });
    await waitFor(() => {
      expect(screen.queryByText('Revisar correos')).toBeNull();
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps the entry and shows a friendly toast when removal fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onRemove = vi.fn().mockResolvedValue({ ok: false, code: 'UNKNOWN' });
    render(<Harness initialEntries={[ENTRY]} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('No se pudo eliminar');
    expect(screen.getByText('Revisar correos')).toBeInTheDocument();
  });
});

const ENTRY_2: TimeEntry = {
  id: 'entry-2',
  category: 'LEARNING',
  description: 'Leer documentacion',
  timeValue: 30,
  date: '2026-10-08',
  timestampCreation: 0,
};

type ReplaceOkResult = { ok: true; entry: TimeEntry };
type ReplaceResult = ReplaceOkResult | { ok: false; code: 'UNKNOWN' };

function EditHarness({
  initialEntries,
  onReplace,
  loading = false,
}: {
  initialEntries: TimeEntry[];
  onReplace: (input: EditTimeEntryInput) => Promise<ReplaceResult>;
  loading?: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  return (
    <EntryList
      entries={entries}
      loading={loading}
      onReplace={async (input) => {
        const result = await onReplace(input);
        if (result.ok) {
          setEntries((current) =>
            current.map((e) => (e.id === input.id ? result.entry : e)),
          );
        }
        return result;
      }}
    />
  );
}

describe('EntryList edit flow', () => {
  it('shows no Editar buttons while the list is loading', () => {
    render(<EditHarness initialEntries={[ENTRY]} onReplace={vi.fn()} loading />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('opens the edit form pre-filled with that row data when Editar is clicked', () => {
    render(<EditHarness initialEntries={[ENTRY]} onReplace={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Descripción')).toHaveProperty('value', 'Revisar correos');
    expect(screen.getByRole('button', { name: 'Trabajo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '60 min' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('keeps only one form open at a time when editing another row', () => {
    render(
      <EditHarness initialEntries={[ENTRY, ENTRY_2]} onReplace={vi.fn()} />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    expect(screen.getByLabelText('Descripción')).toHaveProperty('value', 'Revisar correos');

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    expect(screen.getByLabelText('Descripción')).toHaveProperty('value', 'Leer documentacion');
    expect(screen.getAllByLabelText('Editar entrada')).toHaveLength(1);
  });

  it('closes the form and shows the new data after a successful save', async () => {
    const onReplace = vi.fn().mockImplementation(
      async (): Promise<ReplaceOkResult> => ({
        ok: true,
        entry: { ...ENTRY, id: 'entry-nueva', description: 'Descripcion corregida' },
      }),
    );
    render(<EditHarness initialEntries={[ENTRY]} onReplace={onReplace} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Descripcion corregida' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(onReplace).toHaveBeenCalledWith({
        id: 'entry-1',
        category: 'WORK',
        description: 'Descripcion corregida',
        timeValue: 60,
      });
    });
    await waitFor(() => {
      expect(screen.getByText('Descripcion corregida')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Editar entrada')).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('cancelling restores the row without calling onReplace', async () => {
    const onReplace = vi.fn();
    render(<EditHarness initialEntries={[ENTRY]} onReplace={onReplace} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'No deberia guardarse' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Editar entrada')).toBeNull();
    expect(screen.getByText('Revisar correos')).toBeInTheDocument();
    expect(onReplace).not.toHaveBeenCalled();
  });

  it('edits a past-day entry the same way (US2, FR-010)', async () => {
    const PAST_ENTRY: TimeEntry = {
      id: 'entry-past',
      category: 'WORK',
      description: 'Tarea de enero',
      timeValue: 60,
      date: '2020-01-15',
      timestampCreation: 0,
    };
    const onReplace = vi.fn().mockImplementation(
      async (): Promise<ReplaceOkResult> => ({
        ok: true,
        entry: { ...PAST_ENTRY, id: 'entry-past-nueva', timeValue: 120 },
      }),
    );
    render(<EditHarness initialEntries={[PAST_ENTRY]} onReplace={onReplace} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Descripción')).toHaveProperty('value', 'Tarea de enero');

    fireEvent.click(screen.getByRole('button', { name: '120 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(onReplace).toHaveBeenCalledWith({
        id: 'entry-past',
        category: 'WORK',
        description: 'Tarea de enero',
        timeValue: 120,
      });
    });
    await waitFor(() => {
      expect(screen.getByText('120 min')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Editar entrada')).toBeNull();
  });
});
