import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { AuthForm } from './auth-form';
import messages from '@/messages/en.json';
import type { AnchorHTMLAttributes } from 'react';

vi.mock('@/lib/i18n/navigation', () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

afterEach(cleanup);

describe('AuthForm', () => {
  it('renders accessible login controls', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthForm kind="login" title="Sign in" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Forgot password' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Create account' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Continue with Google/ }),
    ).toBeDisabled();
  });

  it('reveals and hides the password accessibly', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthForm kind="login" title="Sign in" />
      </NextIntlClientProvider>,
    );
    const password = screen.getByLabelText('Password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('renders recovery as an honest unavailable state', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthForm kind="forgot" title="Forgot password" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/provider has not been configured/)).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
