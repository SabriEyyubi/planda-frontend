export type ProjectSummary = {
  id: string;
  developerOrganizationId: string;
  slug: string;
  name: string;
  developerName: string;
  developerVerified: boolean;
  province: { id: string; code: string; name: string; slug: string };
  district: { id: string; code: string; name: string; slug: string };
  latitude: string;
  longitude: string;
  startingPrice: string;
  currency: string;
  deliveryDate: string | null;
  summary: string | null;
  heroImageUrl: string | null;
  stockUpdatedAt: string | null;
  priceUpdatedAt: string | null;
};

export type UnitType = {
  roomType: string;
  availableCount: number;
  minNetArea: string;
  maxNetArea: string;
  startingPrice: string;
  currency: string;
};

export type PaymentPlan = {
  id: string;
  name: string;
  downPaymentPercent: string;
  termMonths: number;
  deliveryPercent: string;
  isRecommended: boolean;
  monthlyPayment?: string | null;
  totalPrice?: string | null;
  cashDiscountPercent?: string | null;
  timelineNote?: string | null;
};

export type ProjectMedia = {
  id: string;
  kind: 'IMAGE';
  url: string;
  altText: string | null;
};

export type ProjectDetail = ProjectSummary & {
  unitTypes: UnitType[];
  paymentPlans: PaymentPlan[];
  availableUnitCount: number;
  media: ProjectMedia[];
};

export type ProjectListResponse = {
  items: ProjectSummary[];
  pageInfo: { hasNextPage: boolean; nextCursor: string | null };
};
