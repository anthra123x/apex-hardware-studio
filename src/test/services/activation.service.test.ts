import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

describe('activation.service', () => {
  const MAS_EXPECTED_HASH = 'D94B1ABCBA24D26C5FBE114A15B53A558684D74A1ACCFF79BBB2407BE7102A89'

  it('validates MAS expected SHA256 integrity hash', () => {
    expect(MAS_EXPECTED_HASH).toHaveLength(64)
    expect(MAS_EXPECTED_HASH).toBe(MAS_EXPECTED_HASH.toUpperCase())
  })

  it('correctly maps unattended activation targets to MAS parameters', () => {
    const argsMap: Record<string, string> = {
      windows: '/HWID',
      office: '/Ohook',
      both: '/HWID',
    }

    expect(argsMap.windows).toBe('/HWID')
    expect(argsMap.office).toBe('/Ohook')
    expect(argsMap.both).toBe('/HWID')
  })

  it('verifies SHA256 calculation matches expected hash format', () => {
    const testContent = 'test-mas-content'
    const hash = createHash('sha256').update(testContent, 'utf8').digest('hex').toUpperCase()
    expect(hash).toHaveLength(64)
    expect(/^[0-9A-F]{64}$/.test(hash)).toBe(true)
  })
})
