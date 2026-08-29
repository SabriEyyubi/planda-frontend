import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url(),
  PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    API_BASE_URL: process.env.API_BASE_URL,
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
