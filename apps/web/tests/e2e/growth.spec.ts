import { expect, type Page, test } from '@playwright/test';

const password = 'DevelopmentOnly!123';

async function login(page: Page, email: string, returnTo: string) {
  await page.goto(`/tr/login?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`${returnTo.replaceAll('/', '\\/')}$`),
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

test('developer analytics renders live metrics and an accessible trend', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, 'developer@planda.test', '/tr/developer/analytics');
  await expect(
    page.getByRole('heading', { name: 'Geliştirici analitiği' }),
  ).toBeVisible();
  await expect(
    page.getByText('Proje görüntülenmesi', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      'Günlük görüntülenme, favori ekleme ve talep çizgi grafiği',
    ),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('developer settings and media surfaces are usable at mobile width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'developer@planda.test', '/tr/developer/settings');
  await expect(
    page.getByRole('heading', { name: 'Geliştirici ayarları' }),
  ).toBeVisible();
  await expect(page.getByLabel('Organizasyon adı')).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Ayarları kaydet' }),
  ).toBeEnabled();
  await expectNoHorizontalOverflow(page);

  await page.goto('/tr/developer/media');
  await expect(
    page.getByRole('heading', { name: 'Medya kütüphanesi' }),
  ).toBeVisible();
  await expect(page.getByLabel('Proje')).toBeVisible();
  await expect(page.getByLabel('Görsel dosyası')).toHaveAttribute(
    'accept',
    'image/jpeg,image/png,image/webp',
  );
  await expectNoHorizontalOverflow(page);
});

test('developer uploads and deletes a real project image', async ({ page }) => {
  await login(page, 'developer@planda.test', '/tr/developer/media');
  await page.getByLabel('Proje').selectOption({ label: 'Seed Park' });
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  await page.getByLabel('Görsel dosyası').setInputFiles({
    name: 'playwright-live.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await page
    .getByLabel('Alternatif metin')
    .first()
    .fill('Playwright canlı görsel');
  await page.getByRole('button', { name: 'Görsel yükle' }).click();
  await expect(page.getByText('Görsel yüklendi.')).toBeVisible();
  const image = page.getByRole('img', { name: 'Playwright canlı görsel' });
  await expect(image).toBeVisible();

  await page.goto('/tr/projects/seed-park');
  const publicImage = page.getByRole('img', {
    name: 'Playwright canlı görsel',
  });
  await expect(publicImage).toBeVisible();
  await expect
    .poll(() =>
      publicImage.evaluate(
        (element) => (element as HTMLImageElement).naturalWidth,
      ),
    )
    .toBeGreaterThan(0);

  await page.goto('/tr/developer/media');
  await page.getByLabel('Proje').selectOption({ label: 'Seed Park' });
  const uploadedCard = page.getByRole('article').filter({
    has: page.getByRole('img', { name: 'Playwright canlı görsel' }),
  });
  page.once('dialog', (confirmation) => confirmation.accept());
  await uploadedCard.getByRole('button', { name: 'Sil' }).click();
  await expect(page.getByText('Görsel silindi.')).toBeVisible();
  await expect(uploadedCard).toHaveCount(0);
});

test('broker can create and soft-archive an agency client', async ({
  page,
}) => {
  await login(page, 'broker@planda.test', '/tr/broker/clients');
  const name = `Playwright Müşteri ${Date.now()}`;
  await page.getByRole('button', { name: 'Müşteri ekle' }).click();
  const dialog = page.getByRole('dialog', { name: 'Müşteri ekle' });
  await dialog.getByLabel('Ad soyad').fill(name);
  await dialog.getByLabel('E-posta').fill('playwright-client@example.test');
  await dialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Değişiklikler kaydedildi.')).toBeVisible();
  const card = page.getByRole('article').filter({ hasText: name });
  await expect(card).toBeVisible();
  page.once('dialog', (confirmation) => confirmation.accept());
  await card.getByRole('button', { name: 'Arşivle' }).click();
  await expect(page.getByText('Müşteri arşivlendi.')).toBeVisible();
  await expect(card).toHaveCount(0);
});

test('broker contacts stay read-only and responsive', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await login(page, 'broker@planda.test', '/tr/broker/contacts');
  await expect(
    page.getByRole('heading', { name: 'Geliştirici iletişimleri' }),
  ).toBeVisible();
  await expect(page.getByText(/salt okunur satış iletişimleri/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /ekle|kaydet/i })).toHaveCount(
    0,
  );
  await expectNoHorizontalOverflow(page);
});
