// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DataTransferButtons from '../../src/components/DataTransferButtons';

afterEach(cleanup);

describe('DataTransferButtons — exportar', () => {
  it('calls onExport when "Exportar datos" is clicked', async () => {
    const onExport = vi.fn().mockResolvedValue({ ok: true });
    const onImport = vi.fn();
    render(
      <DataTransferButtons onExport={onExport} onImport={onImport} importSummary={null} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Exportar datos' }));

    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    expect(onImport).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows a friendly Spanish toast on export failure', async () => {
    const onExport = vi.fn().mockResolvedValue({ ok: false, code: 'UNKNOWN' });
    const onImport = vi.fn();
    render(
      <DataTransferButtons onExport={onExport} onImport={onImport} importSummary={null} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Exportar datos' }));

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('No se pudo completar');
  });

  it('disables both buttons while exporting', () => {
    const onExport = vi.fn();
    render(
      <DataTransferButtons
        onExport={onExport}
        onImport={vi.fn()}
        exporting
        importSummary={null}
      />,
    );
    expect(screen.getByRole('button', { name: 'Exportando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Importar datos' })).toBeDisabled();
  });
});

describe('DataTransferButtons — importar', () => {
  function selectFile(file: File): void {
    const input = screen.getByLabelText('Archivo de respaldo') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
  }

  it('calls onImport with the selected File', async () => {
    const onImport = vi.fn();
    const onExport = vi.fn();
    render(
      <DataTransferButtons onExport={onExport} onImport={onImport} importSummary={null} />,
    );

    const file = new File(['{}'], 'respaldo.json', { type: 'application/json' });
    selectFile(file);

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledWith(file);
    expect(onExport).not.toHaveBeenCalled();
  });

  it('renders the Spanish import summary on success', () => {
    render(
      <DataTransferButtons
        onExport={vi.fn()}
        onImport={vi.fn()}
        importSummary={{ added: 5, skipped: 2 }}
      />,
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Importadas: 5 · Omitidas: 2');
  });

  it('does not call onImport when the selector is cancelled (no change event)', () => {
    const onImport = vi.fn();
    render(
      <DataTransferButtons onExport={vi.fn()} onImport={onImport} importSummary={null} />,
    );
    expect(onImport).not.toHaveBeenCalled();
  });

  it('disables both buttons while importing', () => {
    render(
      <DataTransferButtons
        onExport={vi.fn()}
        onImport={vi.fn()}
        importing
        importSummary={null}
      />,
    );
    expect(screen.getByRole('button', { name: 'Importando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Exportar datos' })).toBeDisabled();
  });
});
