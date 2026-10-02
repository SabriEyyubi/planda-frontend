import type { PaymentPlan, UnitType } from './project';

// Published plans are project-wide. This is a labeled arithmetic illustration,
// never a quote or evidence that the plan applies to this unit type.
export function paymentEstimate(
  unit: UnitType | undefined,
  plan: PaymentPlan | undefined,
  projectCurrency: string,
) {
  if (
    !unit ||
    !plan ||
    unit.currency !== projectCurrency ||
    unit.availableCount <= 0
  )
    return null;
  const total = Number(unit.startingPrice);
  const down = Number(plan.downPaymentPercent);
  const delivery = Number(plan.deliveryPercent);
  if (
    ![total, down, delivery, plan.termMonths].every(Number.isFinite) ||
    total <= 0 ||
    down < 0 ||
    delivery < 0 ||
    down + delivery > 100 ||
    !Number.isInteger(plan.termMonths) ||
    plan.termMonths < 0
  )
    return null;
  const downPayment = (total * down) / 100;
  const deliveryPayment = (total * delivery) / 100;
  const balance = total - downPayment - deliveryPayment;
  if (!plan.termMonths && balance > 0.01) return null;
  return {
    total,
    downPayment,
    deliveryPayment,
    monthly: plan.termMonths ? balance / plan.termMonths : 0,
    currency: unit.currency,
  };
}
