import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeadDialog } from './lead-dialog';
import messages from '@/messages/tr.json';

describe('LeadDialog consent policy', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
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

  it('submits an explicitly selected USD budget with unchanged consent requirements', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <LeadDialog
          projectId="project-1"
          projectName="Test project"
          consentConfig={{
            url: 'https://example.test/consent',
            version: 'test-only-v1',
          }}
        />
      </NextIntlClientProvider>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Satış ofisiyle iletişime geç' }),
    );
    fireEvent.change(screen.getByLabelText('Tercih edilen para birimi'), {
      target: { value: 'USD' },
    });
    fireEvent.change(document.querySelector('input[name="budgetMax"]')!, {
      target: { value: '300000' },
    });
    fireEvent.change(document.querySelector('input[name="fullName"]')!, {
      target: { value: 'Test Person' },
    });
    fireEvent.change(document.querySelector('input[name="phone"]')!, {
      target: { value: '+905551234567' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toMatchObject({
      currency: 'USD',
      budgetMax: '300000',
      consentToDeveloper: true,
      consentVersion: 'test-only-v1',
    });
  });
});

function renderReady(locale = 'tr', context = {}) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LeadDialog
        projectId="project-context"
        projectName="Test project"
        context={context}
        consentConfig={{
          url: 'https://example.test/consent',
          version: 'test-only-v1',
        }}
      />
    </NextIntlClientProvider>,
  );
}
function submitReady() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Satış ofisiyle iletişime geç' }),
  );
  fireEvent.change(document.querySelector('input[name="fullName"]')!, {
    target: { value: 'Test Person' },
  });
  fireEvent.change(document.querySelector('input[name="phone"]')!, {
    target: { value: '+905551234567' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(document.querySelector('form')!);
}
describe('LeadDialog recovery', () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });
  it('preserves plan and question through a locale-independent login link, without persisting contact or consent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 401 })),
    );
    renderReady('en', {
      paymentPlanId: 'plan-1',
      paymentPlanName: 'Flexible',
      unitPreference: '2+1',
      message: 'Delivery date?',
    });
    submitReady();
    const link = await screen.findByRole('link', { name: 'Giriş yap' });
    expect(link.getAttribute('href')).toContain('/en/login?returnTo=');
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    const saved = JSON.parse(
      sessionStorage.getItem('planda:lead-context:project-context')!,
    );
    expect(saved.context).toMatchObject({
      paymentPlanId: 'plan-1',
      message: 'Delivery date?',
    });
    expect(JSON.stringify(saved)).not.toContain('Test Person');
    expect(saved.context).not.toHaveProperty('consentToDeveloper');
  });
  it('retries an uncertain submission with identical payload and idempotency key', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    renderReady('tr', { paymentPlanId: 'plan-1', message: 'Question' });
    submitReady();
    const retry = await screen.findByRole('button', {
      name: 'Aynı talebi tekrar dene',
    });
    expect(document.querySelector('input[name="fullName"]')).toBeDisabled();
    fireEvent.click(retry);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[1]![1]).toEqual(fetch.mock.calls[0]![1]);
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toMatchObject({
      paymentPlanId: 'plan-1',
      message: 'Question',
    });
  });
  it('identifies changed consent instead of treating every conflict as a duplicate', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: 'LEAD_CONSENT_VERSION_MISMATCH' }),
            { status: 409 },
          ),
        ),
    );
    renderReady();
    submitReady();
    expect(
      await screen.findByText(/Onay metni güncellendi/),
    ).toBeInTheDocument();
  });
});
