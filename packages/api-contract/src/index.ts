export { createApiClient } from './generated/client';
import type { components, paths } from './generated/schema';
export type { components, paths } from './generated/schema';

type Schema<Name extends keyof components['schemas']> =
  components['schemas'][Name];

export type PagedResponse<T> = {
  items: T[];
  pageInfo: { hasNextPage: boolean; nextCursor: string | null };
};

export type DeveloperOverview = Schema<'DeveloperOverviewResponseDto'>;
export type DeveloperProject = Schema<'DeveloperProjectItemDto'>;
export type DeveloperUnit = Omit<
  Schema<'UnitResponseDto'>,
  'block' | 'floor'
> & { block?: string | null; floor?: number | null };
export type DeveloperLead = Omit<
  Schema<'LeadResponseDto'>,
  'email' | 'unitPreference' | 'budgetMin' | 'budgetMax'
> & {
  email?: string | null;
  unitPreference?: string | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
};
export type DeveloperPaymentPlan = Omit<
  Schema<'PaymentPlanResponseDto'>,
  'monthlyPayment' | 'totalPrice' | 'cashDiscountPercent' | 'timelineNote'
> & {
  monthlyPayment?: string | null;
  totalPrice?: string | null;
  cashDiscountPercent?: string | null;
  timelineNote?: string | null;
};
export type BrokerProject = Omit<
  Schema<'BrokerProjectResponseDto'>,
  'brokerPrice' | 'commissionPercent' | 'reservationHours' | 'salesContact'
> & {
  brokerPrice?: string | null;
  commissionPercent?: string | null;
  reservationHours?: number | null;
  salesContact?: string | null;
};
export type BrokerMaterial = Omit<
  Schema<'BrokerMaterialMetadataDto'>,
  'fileSizeBytes'
> & { fileSizeBytes?: string | null };
export type AdminOverview = Schema<'AdminOverviewResponseDto'>;
export type AdminReviewProject = Schema<'AdminProjectReadItemDto'>;
export type AdminQualityItem = Schema<'AdminProjectReadItemDto'>;
export type AdminStatusResult = Schema<'AdminProjectMutationResponseDto'>;
export type DeveloperAnalytics = Schema<'DeveloperAnalyticsResponseDto'>;
export type BrokerClient = Schema<'BrokerClientResponseDto'>;
export type BrokerClientList = Omit<
  Schema<'BrokerClientListResponseDto'>,
  'pageInfo'
> & {
  pageInfo: { hasNextPage: boolean; nextCursor: string | null };
};
export type BrokerContact = Schema<'BrokerContactResponseDto'>;
export type DeveloperMedia = Schema<'DeveloperMediaResponseDto'>;
export type DeveloperSettings = Schema<'DeveloperSettingsResponseDto'>;
export type OrganizationScope = Schema<'OrganizationScopeResponseDto'>;

type ApiPath = keyof paths & string;
type ApiV1Path = ApiPath extends infer Path
  ? Path extends `/api/v1/${infer Rest}`
    ? Rest
    : never
  : never;
type RouteTemplate<Path extends string> =
  Path extends `${infer Head}{${string}}${infer Tail}`
    ? RouteTemplate<`${Head}:${string}${Tail}`>
    : Path;
type OperationsRoute = RouteTemplate<ApiV1Path>;

export const OPERATIONS_ROUTES = {
  GET: [
    'developer/overview',
    'developer/organizations',
    'developer/projects',
    'developer/projects/:projectId',
    'developer/projects/:projectId/units',
    'developer/leads',
    'developer/projects/:projectId/payment-plans',
    'developer/analytics',
    'developer/settings',
    'developer/projects/:projectId/media',
    'broker/projects',
    'broker/organizations',
    'broker/projects/:projectId',
    'broker/projects/:projectId/materials',
    'broker/clients',
    'broker/clients/:clientId',
    'broker/contacts',
    'admin/overview',
    'admin/projects/review-queue',
    'admin/data-quality',
  ],
  PATCH: [
    'developer/projects/:projectId',
    'developer/projects/:projectId/units/:unitId',
    'developer/leads/:leadId',
    'developer/projects/:projectId/payment-plans/:planId',
    'developer/projects/:projectId/media/:mediaId',
    'developer/settings',
    'broker/clients/:clientId',
    'admin/projects/:projectId/status',
  ],
  POST: ['developer/projects/:projectId/media', 'broker/clients'],
  PUT: ['developer/projects/:projectId/media/reorder'],
  DELETE: [
    'developer/projects/:projectId/payment-plans/:planId',
    'developer/projects/:projectId/media/:mediaId',
    'broker/clients/:clientId',
  ],
} as const satisfies Record<string, readonly OperationsRoute[]>;
