import { Env } from '../types';

export function validateEnv(env: Env) {
    const missing: string[] = [];

    // Critical bindings - App will fail without these
    if (!env.DB) missing.push('DB');
    if (!env.JWT_SECRET) missing.push('JWT_SECRET');

    // Environment context
    if (!env.ENVIRONMENT) {
        // Default to development if not set, but warn
        console.warn('[ENV] ENVIRONMENT not set, defaulting to "development"');
    }

    if (missing.length > 0) {
        const errorMsg = `Critical environment bindings missing: ${missing.join(', ')}`;
        console.error(`[ENV CRITICAL] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // Optional but recommended bindings - Log warning if missing
    const recommended = [
        'RESEND_API_KEY',
        'IMAGES',
        'R2_PUBLIC_URL',
        'CORS_ORIGIN'
    ];

    const missingRecommended = recommended.filter(key => !env[key as keyof Env]);

    if (missingRecommended.length > 0 && env.ENVIRONMENT !== 'development') {
        console.warn(`[ENV WARNING] Missing recommended bindings: ${missingRecommended.join(', ')}`);
    }
}
