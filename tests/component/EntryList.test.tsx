// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EntryList from '../../src/components/EntryList';
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
