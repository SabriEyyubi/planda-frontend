import { expect, test } from '@playwright/test';

test('refresh endpoint rejects state-changing GET requests', async ({
  request,
}) => {
  const response = await request.get('/api/auth/refresh');
  expect(response.status()).toBe(405);
  expect(response.headers().allow).toBe('POST');
});

test('homepage to project surfaces', async ({ page }) => {
  await page.goto('/tr');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/tr/projects');
  await expect(page.getByRole('heading', { name: 'Projeler' })).toBeVisible();
  await page.locator('main a[href*="/projects/"]').first().click();
  await expect(page).toHaveURL(/\/tr\/projects\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('project detail records a best-effort first-party view', async ({
  page,
}) => {
  let payload: { sessionId?: string } | undefined;
  await page.route('**/api/projects/*/views', async (route) => {
    payload = route.request().postDataJSON() as { sessionId?: string };
    await route.fulfill({ status: 200, json: { recorded: true } });
  });
  await page.goto('/tr/projects');
  const firstProject = page.locator('main a[href*="/projects/"]').first();
  test.skip(
    (await firstProject.count()) === 0,
    'The connected backend has no published project to record.',
  );
  await firstProject.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect
    .poll(() => payload?.sessionId)
    .toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
});

test('unknown project slugs render not found', async ({ page }) => {
  await page.goto('/tr/projects/unknown-project');
  await expect(
    page.getByRole('heading', { name: 'Sayfa bulunamadı' }),
  ).toBeVisible();
});

test('map loads its basemap and keeps result selection in sync', async ({
  page,
}) => {
  await page.goto('/tr/map');
  await expect(page.locator('.map-loading')).toBeHidden({ timeout: 20_000 });
  await expect(page.locator('.map-error')).toHaveCount(0);
  await expect(page.locator('.map-price-marker')).toHaveCount(6);

  const secondResult = page.locator('.map-result').nth(1);
  await secondResult.click();
  await expect(secondResult).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.map-price-marker.is-selected')).toHaveCount(1);
});

test('desktop map filters are visible and update the query', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tr/map');

  await page.getByRole('button', { name: 'Filtreler' }).click();
  const dialog = page.getByRole('dialog', { name: 'Filtreler' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Konum veya proje').fill('Başakşehir');
  await dialog.getByRole('button', { name: 'Projeleri göster' }).click();

  await expect(page).toHaveURL(/\/tr\/map\?q=Ba%C5%9Fak%C5%9Fehir/);
  await expect(page.getByText('1 aktif filtre')).toBeVisible();
});

test('defaults to Turkish and marks Arabic as RTL', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/tr$/);
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('core buyer journeys use English fallback outside Turkish', async ({
  page,
}) => {
  for (const locale of ['en', 'ar', 'ru']) {
    await page.goto(`/${locale}`);
    await expect(
      page.getByRole('heading', {
        name: 'Projects',
        level: 1,
      }),
    ).toBeVisible();
    await page.goto(`/${locale}/projects`);
    await expect(
      page.getByRole('heading', { name: 'Projects', level: 1 }),
    ).toBeVisible();
    await page.locator('main a[href*="/projects/"]').first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/projects/[^/]+$`));
    await expect(
      page.getByRole('button', { name: 'Contact the sales office' }),
    ).toBeVisible();
  }
});

test('restores the intended protected route after login', async ({ page }) => {
  await page.goto('/tr/profile');
  await expect(page).toHaveURL(/\/tr\/login\?returnTo=%2Ftr%2Fprofile$/);
});
