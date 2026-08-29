export type AnalyticsEventName =
  | 'project_view'
  | 'project_card_click'
  | 'map_pin_select'
  | 'favorite_add'
  | 'compare_add'
  | 'lead_submit'
  | 'payment_plan_view'
  | 'login'
  | 'register_complete';

export interface Analytics {
  track(
    name: AnalyticsEventName,
    properties?: Record<string, string | number | boolean>,
  ): void;
}

export const analytics: Analytics = { track: () => undefined };
