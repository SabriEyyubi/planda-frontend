import { describe, expect, it } from 'vitest';
import { paymentEstimate } from './payment-estimate';
const unit = {
  roomType: '2+1',
  currency: 'TRY',
  startingPrice: '12000000',
  availableCount: 1,
  minNetArea: '90',
  maxNetArea: '110',
};
const plan = {
  id: 'plan',
  name: 'Plan',
  downPaymentPercent: '30',
  deliveryPercent: '10',
  termMonths: 24,
  isRecommended: false,
};
describe('illustrative payment breakdown', () => {
  it('balances downpayment, installments and delivery without converting currency', () => {
    const result = paymentEstimate(unit, plan, 'TRY')!;
    expect(result).toMatchObject({
      total: 12000000,
      downPayment: 3600000,
      monthly: 300000,
      deliveryPayment: 1200000,
      currency: 'TRY',
    });
    expect(
      result.downPayment + result.monthly * 24 + result.deliveryPayment,
    ).toBe(result.total);
    expect(
      paymentEstimate({ ...unit, currency: 'USD' }, plan, 'TRY'),
    ).toBeNull();
  });
  it('does not invent a schedule when percentages, inventory or term are incompatible', () => {
    expect(paymentEstimate(unit, { ...plan, termMonths: 0 }, 'TRY')).toBeNull();
    expect(
      paymentEstimate(unit, { ...plan, deliveryPercent: '90' }, 'TRY'),
    ).toBeNull();
    expect(
      paymentEstimate({ ...unit, availableCount: 0 }, plan, 'TRY'),
    ).toBeNull();
    expect(
      paymentEstimate(unit, { ...plan, downPaymentPercent: 'NaN' }, 'TRY'),
    ).toBeNull();
    expect(
      paymentEstimate(
        unit,
        {
          ...plan,
          downPaymentPercent: '100',
          deliveryPercent: '0',
          termMonths: 0,
        },
        'TRY',
      )?.monthly,
    ).toBe(0);
  });
});
