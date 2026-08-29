import { z } from 'zod';

const leadConsentSchema = z
  .object({
    url: z.string().refine((value) => {
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }),
    version: z.string().trim().min(1).max(100),
  })
  .strict();

export type LeadConsentConfig = z.infer<typeof leadConsentSchema>;

export function parseLeadConsentConfig(source: {
  url?: string;
  version?: string;
}): LeadConsentConfig | null {
  const result = leadConsentSchema.safeParse(source);
  return result.success ? result.data : null;
}

export const leadConsentConfig = parseLeadConsentConfig({
  url: process.env.NEXT_PUBLIC_LEAD_CONSENT_URL,
  version: process.env.NEXT_PUBLIC_LEAD_CONSENT_VERSION,
});
