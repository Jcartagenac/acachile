export function determineOverallStatus(checks: Record<string, { status: 'healthy' | 'unhealthy' }>): 'healthy' | 'degraded' | 'unhealthy'
export function getStatusCode(status: 'healthy' | 'degraded' | 'unhealthy'): number
