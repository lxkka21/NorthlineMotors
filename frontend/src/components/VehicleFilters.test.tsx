import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VehicleFilters } from './VehicleFilters';

describe('VehicleFilters', () => {
  it('reports text and price filter changes and supports clearing', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<VehicleFilters filters={{}} onChange={onChange} onClear={onClear} />);
    fireEvent.change(screen.getByLabelText('Search make'), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '30000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenNthCalledWith(1, { make: 'Toyota' });
    expect(onChange).toHaveBeenNthCalledWith(2, { maxPrice: '30000' });
    expect(onClear).toHaveBeenCalledOnce();
  });
});

