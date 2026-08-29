import type { ProjectDetail, ProjectSummary } from './project';

const location = {
  province: { id: 'p-34', code: 'TR-34', name: 'İstanbul', slug: 'istanbul' },
};

export const projectFixtures: ProjectSummary[] = [
  [
    'nova-basaksehir',
    'Nova Başakşehir',
    'Nova Yapı',
    'Başakşehir',
    '7.500.000',
    '28.8062',
    '41.0938',
    '2027-12-31',
  ],
  [
    'vadi-loft',
    'Vadi Loft',
    'Vadi GYO',
    'Kağıthane',
    '9.200.000',
    '28.9684',
    '41.0811',
    '2028-06-30',
  ],
  [
    'marmara-terrace',
    'Marmara Terrace',
    'MRT İnşaat',
    'Beylikdüzü',
    '6.800.000',
    '28.6418',
    '41.0012',
    null,
  ],
  [
    'aden-bahcesehir',
    'Aden Bahçeşehir',
    'Aden Yapı',
    'Bahçeşehir',
    '8.100.000',
    '28.6903',
    '41.0618',
    '2028-03-31',
  ],
  [
    'kule-216',
    'Kule 216',
    'Ant Holding',
    'Ataşehir',
    '11.400.000',
    '29.1244',
    '40.9923',
    '2028-09-30',
  ],
  [
    'deniz-marmaris',
    'Deniz Marmaris',
    'Deniz Yapı',
    'Zeytinburnu',
    '14.900.000',
    '28.9012',
    '40.9920',
    '2027-12-31',
  ],
].map(
  (
    [
      slug,
      name,
      developerName,
      district,
      price,
      longitude,
      latitude,
      deliveryDate,
    ],
    index,
  ) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    developerOrganizationId: `fixture-developer-${index}`,
    slug: slug!,
    name: name!,
    developerName: developerName!,
    developerVerified: index < 4,
    ...location,
    district: {
      id: `d-${index}`,
      code: `TR-34-${index}`,
      name: district!,
      slug: district!.toLocaleLowerCase('tr').replaceAll(' ', '-'),
    },
    latitude: latitude!,
    longitude: longitude!,
    startingPrice: price!.replaceAll('.', '') + '.0000',
    currency: 'TRY',
    deliveryDate: deliveryDate ?? null,
    summary:
      'Metro bağlantılarına yakın, geliştirici kaynaklı güncel stok ve esnek ödeme planları sunan yeni konut projesi.',
    heroImageUrl: null,
    stockUpdatedAt: new Date(
      Date.parse('2026-08-27T09:00:00.000Z') - index * 3_600_000,
    ).toISOString(),
    priceUpdatedAt: new Date(
      Date.parse('2026-08-27T09:00:00.000Z') - index * 7_200_000,
    ).toISOString(),
  }),
);

export const projectDetailFixture: ProjectDetail = {
  ...projectFixtures[0]!,
  media: [],
  availableUnitCount: 23,
  unitTypes: [
    {
      roomType: '1+1',
      availableCount: 8,
      minNetArea: '62.50',
      maxNetArea: '68.00',
      startingPrice: '7500000.0000',
      currency: 'TRY',
    },
    {
      roomType: '2+1',
      availableCount: 11,
      minNetArea: '86.50',
      maxNetArea: '101.00',
      startingPrice: '8750000.0000',
      currency: 'TRY',
    },
    {
      roomType: '3+1',
      availableCount: 4,
      minNetArea: '124.00',
      maxNetArea: '142.00',
      startingPrice: '11200000.0000',
      currency: 'TRY',
    },
  ],
  paymentPlans: [
    {
      id: 'plan-a',
      name: 'Plan A',
      downPaymentPercent: '30.00',
      termMonths: 24,
      deliveryPercent: '0.00',
      isRecommended: true,
    },
    {
      id: 'plan-b',
      name: 'Plan B',
      downPaymentPercent: '40.00',
      termMonths: 36,
      deliveryPercent: '10.00',
      isRecommended: false,
    },
    {
      id: 'plan-c',
      name: 'Peşin',
      downPaymentPercent: '100.00',
      termMonths: 0,
      deliveryPercent: '0.00',
      isRecommended: false,
    },
  ],
};

export function detailFixtureFor(slug: string): ProjectDetail | undefined {
  const project = projectFixtures.find((item) => item.slug === slug);
  return project ? { ...projectDetailFixture, ...project } : undefined;
}
