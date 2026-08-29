import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/en.json';
import { LanguageSwitcher } from './language-switcher';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('@/lib/i18n/navigation', () => ({
  usePathname: () => '/projects',
  useRouter: () => ({ replace: navigation.replace }),
}));

afterEach(() => vi.clearAllMocks());

describe('LanguageSwitcher', () => {
  it('switches locale without losing the current path', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Language selection'), {
      target: { value: 'tr' },
    });
    expect(navigation.replace).toHaveBeenCalledWith('/projects', {
      locale: 'tr',
    });
  });
});
