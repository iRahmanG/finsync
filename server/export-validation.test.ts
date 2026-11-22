import { describe, expect, it } from 'vitest'
import { reconciledStatement } from '../src/test-fixtures'
import { parseExportRequestJson, validateExportRequest } from './export-validation'

describe('export request validation', () => {
  it('accepts the backward-compatible statement request shape', () => {
    expect(validateExportRequest(reconciledStatement)?.statement).toEqual(reconciledStatement)
  })

  it('rejects malformed financial data and unsupported configuration', () => {
    expect(validateExportRequest({
      statement: {
        ...reconciledStatement,
        transactions: [{ ...reconciledStatement.transactions[0], type: 'TRANSFER' }],
      },
      rendererConfig: { brandName: 'FinSync', locale: 'en-IN' },
    })).toBeUndefined()
    expect(validateExportRequest({
      statement: reconciledStatement,
      rendererConfig: { brandName: 'FinSync', locale: 'en-IN', logoUrl: 'https://example.com/logo.svg' },
    })).toBeUndefined()
  })

  it('allows a structurally valid statement with an incorrect closing balance', () => {
    const mismatched = {
      ...reconciledStatement,
      closingBalancePaise: reconciledStatement.closingBalancePaise + 1,
    }
    expect(validateExportRequest(mismatched)?.statement).toEqual(mismatched)
  })

  it('separates malformed JSON from structurally invalid export requests', () => {
    expect(parseExportRequestJson('{bad json')).toEqual({ ok: false })
    expect(parseExportRequestJson('{}').ok).toBe(true)
    expect(validateExportRequest({})).toBeUndefined()
  })
})
