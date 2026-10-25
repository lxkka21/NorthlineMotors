import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartDrawer } from './CartDrawer';

const line = { vehicle: { id: '1', make: 'Toyota', model: 'Camry', category: 'Sedan', year: 2025, price: 28000, quantityInStock: 2, createdAt: '', updatedAt: '' }, quantity: 1 };
const props = { open: true, lines: [line], confirmedOrder: null, onClose: vi.fn(), onQuantity: vi.fn(), onRemove: vi.fn(), onCheckout: vi.fn(), onDismissConfirmation: vi.fn() };

describe('CartDrawer', () => {
  it('shows a line item, supports quantity changes, and removes it', () => {
    render(<CartDrawer {...props} />);
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase Camry quantity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(props.onQuantity).toHaveBeenCalledWith('1', 2);
    expect(props.onRemove).toHaveBeenCalledWith('1');
  });

  it('prevents checkout from submitting incomplete customer details', () => {
    render(<CartDrawer {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue to checkout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Complete purchase' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add your name');
    expect(props.onCheckout).not.toHaveBeenCalled();
  });
});
