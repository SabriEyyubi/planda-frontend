import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { LeadDialog } from './lead-dialog';
import messages from '@/messages/tr.json';

describe('LeadDialog consent policy', () => {
  it('keeps consent and submission disabled while legal config is unavailable', () => {
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <LeadDialog
          projectId="project-1"
          projectName="Nova Başakşehir"
          consentConfig={null}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Satış ofisiyle iletişime geç' }),
    );

    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Talebi gönder' }),
    ).toBeDisabled();
    expect(screen.getByText(/onaylı yasal metin URL’si/)).toHaveAttribute(
      'role',
      'status',
    );
    expect(screen.queryByRole('link', { name: 'Aydınlatma metni' })).toBeNull();
  });
});
