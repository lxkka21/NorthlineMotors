import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('exposes the dealership contact links and quick links', () => {
    render(<MemoryRouter><SiteFooter onOpenCart={vi.fn()} onOpenOrders={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'suryalakavalli@gmail.com' })).toHaveAttribute('href', 'mailto:suryalakavalli@gmail.com');
    expect(screen.getByRole('link', { name: '+91 6366582056' })).toHaveAttribute('href', 'tel:+916366582056');
    expect(screen.getByText('Monday–Saturday')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/');
  });
});
