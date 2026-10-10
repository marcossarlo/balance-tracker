// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuickEntryBar from '../../src/components/QuickEntryBar';

afterEach(cleanup);

function fillAndSubmitValidForm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Trabajo' }));
  fireEvent.change(screen.getByLabelText('Descripción'), {
    target: { value: 'Revisar correos' },
  });
  fireEvent.click(screen.getByRole('button', { name: '60 min' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
}

describe('QuickEntryBar', () => {
  it('resets silently after a successful save', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    render(<QuickEntryBar onSave={onSave} />);

    fillAndSubmitValidForm();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        category: 'WORK',
        description: 'Revisar correos',
        timeValue: 60,
      });
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Descripción')).toHaveProperty('value', '');
    });
    expect(screen.getByRole('button', { name: 'Trabajo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: '60 min' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows a non-blocking Spanish toast on storage failure and keeps form state', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: false, code: 'QUOTA_EXCEEDED' });
    render(<QuickEntryBar onSave={onSave} />);

    fillAndSubmitValidForm();

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('espacio');
    expect(screen.getByLabelText('Descripción')).toHaveProperty('value', 'Revisar correos');
    expect(screen.getByRole('button', { name: 'Trabajo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does not call onSave and shows what is missing when data is incomplete', async () => {
    const onSave = vi.fn();
    render(<QuickEntryBar onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('categoría');
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Aprendizaje' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('descripción');
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Practicar' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('duración');
    expect(onSave).not.toHaveBeenCalled();
  });
});
