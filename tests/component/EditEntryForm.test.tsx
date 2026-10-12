// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EditEntryForm from '../../src/components/EditEntryForm';
import type { TimeEntry } from '../../src/core/types';

afterEach(cleanup);

const ENTRY: TimeEntry = {
  id: 'entry-1',
  category: 'WORK',
  description: 'Revisar correos',
  timeValue: 60,
  date: '2026-10-08',
  timestampCreation: 0,
};

describe('EditEntryForm', () => {
  it('pre-fills category, description and duration from the entry', () => {
    render(<EditEntryForm entry={ENTRY} onReplace={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Trabajo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Aprendizaje' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByLabelText('Descripción')).toHaveProperty(
      'value',
      'Revisar correos',
    );
    expect(screen.getByRole('button', { name: '60 min' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('calls onReplace with the visible values when saving', async () => {
    const onReplace = vi.fn().mockResolvedValue({ ok: true });
    render(<EditEntryForm entry={ENTRY} onReplace={onReplace} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Corregir descripcion' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aprendizaje' }));
    fireEvent.click(screen.getByRole('button', { name: '120 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(onReplace).toHaveBeenCalledWith({
        id: 'entry-1',
        category: 'LEARNING',
        description: 'Corregir descripcion',
        timeValue: 120,
      });
    });
  });

  it('shows a validation message and keeps the form when description is empty', async () => {
    const onReplace = vi.fn();
    render(<EditEntryForm entry={ENTRY} onReplace={onReplace} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('descripción');
    expect(onReplace).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('calls onCancel without calling onReplace when cancelled', () => {
    const onReplace = vi.fn();
    const onCancel = vi.fn();
    render(<EditEntryForm entry={ENTRY} onReplace={onReplace} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onReplace).not.toHaveBeenCalled();
  });

  it('shows a friendly Spanish toast and keeps the form open on failure', async () => {
    const onReplace = vi.fn().mockResolvedValue({ ok: false, code: 'UNKNOWN' });
    render(<EditEntryForm entry={ENTRY} onReplace={onReplace} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('No se pudo editar');
    expect(screen.getByLabelText('Descripción')).toHaveProperty(
      'value',
      'Revisar correos',
    );
  });

  it('disables Guardar while the replace promise is in flight', async () => {
    let resolveReplace!: (value: { ok: true }) => void;
    const onReplace = vi.fn().mockImplementation(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveReplace = resolve;
        }),
    );
    render(<EditEntryForm entry={ENTRY} onReplace={onReplace} onCancel={vi.fn()} />);

    const guardar = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(guardar);

    await waitFor(() => {
      expect(guardar).toBeDisabled();
    });

    resolveReplace({ ok: true });

    await waitFor(() => {
      expect(guardar).toBeEnabled();
    });
  });
});
