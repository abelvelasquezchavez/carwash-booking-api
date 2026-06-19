import { z } from 'zod';

/**
 * Environment validation. The process fails fast at boot if anything required
 * is missing or malformed, so the app never starts in a half-configured state.
 */
const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().min(1).default('1d'),
    BUSINESS_OPEN: z.coerce.number().int().min(0).max(23).default(8),
    BUSINESS_CLOSE: z.coerce.number().int().min(1).max(24).default(18),
  })
  .refine((env) => env.BUSINESS_OPEN < env.BUSINESS_CLOSE, {
    message: 'BUSINESS_OPEN must be earlier than BUSINESS_CLOSE',
    path: ['BUSINESS_OPEN'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`❌ Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export type Env = z.infer<typeof envSchema>;

export const env: Env = parsed.data;
