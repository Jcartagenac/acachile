import { Env } from '../types';

export function validateEnv(env: Env) {
    const missing: string[] = [];

    // Critical bindings - App will fail without these
    if (!env.DB) missing.push('DB');
    if (!env.JWT_SECRET) missing.push('JWT_SECRET');

    if (missing.length > 0) {
        const errorMsg = `Critical environment bindings missing: ${missing.join(', ')}`;
        // Solo log en el primer error (ya que se cachea)
        console.error(`[ENV CRITICAL] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // Validación exitosa - no necesitamos logs adicionales para mejor rendimiento
}
