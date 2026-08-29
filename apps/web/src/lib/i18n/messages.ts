export type MessageTree = {
  [key: string]: string | MessageTree;
};

export function mergeMessages(
  fallback: MessageTree,
  localized: MessageTree,
): MessageTree {
  return Object.fromEntries(
    [...new Set([...Object.keys(fallback), ...Object.keys(localized)])].map(
      (key) => {
        const fallbackValue = fallback[key];
        const localizedValue = localized[key];
        if (
          typeof fallbackValue === 'object' &&
          typeof localizedValue === 'object'
        ) {
          return [key, mergeMessages(fallbackValue, localizedValue)];
        }
        return [key, localizedValue ?? fallbackValue];
      },
    ),
  );
}
