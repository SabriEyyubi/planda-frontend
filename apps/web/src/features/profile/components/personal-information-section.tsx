import { getTranslations } from 'next-intl/server';

export async function PersonalInformationSection() {
  const t = await getTranslations('Profile');
  return (
    <section className="card">
      <h2>{t('personalInformation')}</h2>
      <p className="muted">{t('contractPending')}</p>
    </section>
  );
}
