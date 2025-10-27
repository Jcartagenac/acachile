// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { determineOverallStatus, getStatusCode } from '../health.js'

describe('health utils', () => {
  it('returns healthy when all checks pass', () => {
    const status = determineOverallStatus({
      api: { status: 'healthy' },
      database: { status: 'healthy' },
    })

    expect(status).toBe('healthy')
  })

  it('returns degraded when a single check fails', () => {
    const status = determineOverallStatus({
      api: { status: 'healthy' },
      database: { status: 'unhealthy' },
    })

    expect(status).toBe('degraded')
  })

  it('returns unhealthy when more than two checks fail', () => {
    const status = determineOverallStatus({
      api: { status: 'unhealthy' },
      database: { status: 'unhealthy' },
      kv: { status: 'unhealthy' },
    })

    expect(status).toBe('unhealthy')
  })

  it('getStatusCode maps status to appropriate HTTP codes', () => {
    expect(getStatusCode('healthy')).toBe(200)
    expect(getStatusCode('degraded')).toBe(200)
    expect(getStatusCode('unhealthy')).toBe(503)
  })
})
