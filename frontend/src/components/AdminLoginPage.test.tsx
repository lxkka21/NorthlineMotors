import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminLoginPage } from './AdminLoginPage';

const admin = { token: 'admin-token', user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' as const } };
const customer = { token: 'customer-token', user: { id: 'user-1', email: 'user@example.com', role: 'user' as const } };

describe('AdminLoginPage', () => {
  it('accepts an administrator and rejects a normal role without saving a session', async () => {
    const onAuthenticated = vi.fn(); const login = vi.fn().mockResolvedValue(customer);
    render(<MemoryRouter><AdminLoginPage login={login} onAuthenticated={onAuthenticated} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Admin email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Admin password'), { target: { value: 'correct horse battery staple' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter admin dashboard' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('administrators only');
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('submits valid admin credentials', async () => {
    const onAuthenticated = vi.fn(); const login = vi.fn().mockResolvedValue(admin);
    render(<MemoryRouter><AdminLoginPage login={login} onAuthenticated={onAuthenticated} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Admin email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Admin password'), { target: { value: 'correct horse battery staple' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter admin dashboard' }));
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(admin));
  });
});
