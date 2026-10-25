import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

describe('AuthScreen', () => {
  it('validates registration credentials before calling the API', async () => {
    const request = vi.fn();
    render(<AuthScreen request={request} onAuthenticated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'register' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('valid email');
    expect(request).not.toHaveBeenCalled();
  });

  it('shows API errors and loading state', async () => {
    const request = vi.fn().mockRejectedValue(new Error('Email already exists'));
    render(<AuthScreen request={request} onAuthenticated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'driver@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a secure password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enter workspace' })).toBeEnabled());
  });
});
