import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';
import { PaymentPlanSheet } from './payment-plan-sheet';

afterEach(cleanup);

describe('payment plan denomination', () => {
  it.each(['TRY', 'USD'])(
    'keeps %s in total and installment estimates',
    (currency) => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <PaymentPlanSheet
            startingPrice="300000"
            currency={currency}
            plan={{
              id: 'plan',
              name: 'Plan',
              downPaymentPercent: '20',
              deliveryPercent: '20',
              termMonths: 12,
              isRecommended: false,
            }}
          />
        </NextIntlClientProvider>,
      );
      fireEvent.click(screen.getByRole('button'));
      const dialog = within(screen.getByRole('dialog'));
      const format = (value: number) =>
        new Intl.NumberFormat('en', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(value);
      const exactText = { normalizer: (text: string) => text };
      expect(dialog.getByText(format(300000), exactText)).toBeInTheDocument();
      expect(dialog.getAllByText(format(60000), exactText)).toHaveLength(2);
      expect(
        dialog.getByText(`${format(15000)} / ay`, exactText),
      ).toBeInTheDocument();
    },
  );
});

it('withholds a zero-term schedule with an unpaid balance', () => {
  render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <PaymentPlanSheet
        startingPrice="1000000"
        currency="TRY"
        plan={{
          id: 'invalid',
          name: 'Invalid',
          downPaymentPercent: '30',
          deliveryPercent: '0',
          termMonths: 0,
          isRecommended: false,
        }}
      />
    </NextIntlClientProvider>,
  );
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('status')).toHaveTextContent('Ödeme takvimi eksik');
  expect(
    screen.queryByText(messages.ProjectDetail.noInstallments),
  ).not.toBeInTheDocument();
});
