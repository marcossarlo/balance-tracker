// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuickEntryBar from '../../src/components/QuickEntryBar';

afterEach(cleanup);

function fillFormAndSubmit(): void {
  fireEvent.click(screen.getByRole('radio', { name: 'Trabajo' }));
  fireEvent.change(screen.getByLabelText('Descripción'), {
    target: { value: 'Revisar correos' },
  });
  fireEvent.click(screen.getByRole('button', { name: '1h' }));
  fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
}

describe('QuickEntryBar', () => {
  it('renders the quick-entry layout with radiogroup, pills and Registrar', () => {
    render(<QuickEntryBar onSave={vi.fn()} />);
    expect(
      screen.getByPlaceholderText('¿En qué invertiste tu tiempo?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Categoría' })).toBeInTheDocument();
    for (const label of ['15m', '30m', '1h', '2h', '3h', '4h']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument();
  });

  it('resets silently after a successful save', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    render(<QuickEntryBar onSave={onSave} />);

    fillFormAndSubmit();

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
    expect(screen.getByRole('radio', { name: 'Trabajo' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('button', { name: '1h' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('submits with Enter (native form submission) from the description input', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const { container } = render(<QuickEntryBar onSave={onSave} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Aprendizaje' }));
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Leer documentación' },
    });
    fireEvent.click(screen.getByRole('button', { name: '2h' }));
    // Enter en un input dentro de un <form> con botón submit dispara submit nativo
    fireEvent.keyDown(screen.getByLabelText('Descripción'), { key: 'Enter' });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        category: 'LEARNING',
        description: 'Leer documentación',
        timeValue: 120,
      });
    });
  });

  it('tints the duration pills with the selected category color', () => {
    render(<QuickEntryBar onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Aprendizaje' }));
    const pill = screen.getByRole('button', { name: '30m' });
    expect(pill.className).toContain('bg-learning');
  });

  it('shows a non-blocking Spanish toast on storage failure and keeps form state', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: false, code: 'QUOTA_EXCEEDED' });
    render(<QuickEntryBar onSave={onSave} />);

    fillFormAndSubmit();

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('espacio');
    expect(screen.getByLabelText('Descripción')).toHaveProperty('value', 'Revisar correos');
    expect(screen.getByRole('radio', { name: 'Trabajo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('does not call onSave and shows role="alert" when data is incomplete', async () => {
    const onSave = vi.fn();
    render(<QuickEntryBar onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('categoría');
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: 'Aprendizaje' }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('descripción');
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Practicar' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('duración');
    expect(onSave).not.toHaveBeenCalled();
  });
});
