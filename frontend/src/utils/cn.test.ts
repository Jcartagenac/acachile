import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('merges tailwind classes by keeping the last conflicting class', () => {
    const result = cn('p-2', 'text-sm', 'text-lg', { 'font-bold': true })
    expect(result).toBe('p-2 text-lg font-bold')
  })
})
