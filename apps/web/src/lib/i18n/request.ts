import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { mergeMessages, type MessageTree } from './messages';
import englishMessages from '../../messages/en.json';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const localizedMessages = (await import(`../../messages/${locale}.json`))
    .default as MessageTree;
  return {
    locale,
    messages: mergeMessages(englishMessages as MessageTree, localizedMessages),
  };
});
