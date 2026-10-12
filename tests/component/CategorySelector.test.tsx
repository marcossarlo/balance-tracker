// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CategorySelector from '../../src/components/CategorySelector';

afterEach(cleanup);

describe('CategorySelector', () => {
  it('renders a radiogroup labelled "Categoría" with both category radios', () => {
    render(<CategorySelector value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: 'Categoría' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Trabajo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Aprendizaje' })).toBeInTheDocument();
  });

  it('marks the selected category with aria-checked', () => {
    render(<CategorySelector value="WORK" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Trabajo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Aprendizaje' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('emits onChange with the clicked category', () => {
    const onChange = vi.fn();
    render(<CategorySelector value="WORK" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Aprendizaje' }));
    expect(onChange).toHaveBeenCalledWith('LEARNING');
  });

  it('has no checked option when value is null', () => {
    render(<CategorySelector value={null} onChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    for (const radio of radios) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('applies the category color token class to the active option', () => {
    render(<CategorySelector value="LEARNING" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Aprendizaje' }).className).toContain(
      'bg-learning',
    );
    expect(screen.getByRole('radio', { name: 'Trabajo' }).className).not.toContain(
      'bg-work',
    );
  });
});
