import { describe, expect, it } from 'vitest'
import {
  calculateRunningBalances,
  calculateTotals,
  formatCurrency,
  formatExportCurrency,
  formatDate,
  formatStatementPeriod,
  getReconciliation,
  isValidIsoDate,
  maskAccountNumber,
  normalizeStatement,
  validateStatement,
} from './financial'
import type { Statement } from './types'
import { statement as demoStatement } from './data/statement'

const validStatement: Statement = {
  accountHolder: 'Aarav Mehta',
  accountNumber: '4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 5_000_000,
  closingBalancePaise: 5_250_000,
  transactions: [
    { id: 'credit-1', date: '2024-06-10', description: 'Salary', reference: 'SAL-1', type: 'CREDIT', amountPaise: 350_000, balancePaise: 5_350_000 },
    { id: 'debit-1', date: '2024-06-20', description: 'Rent', reference: 'RENT-1', type: 'DEBIT', amountPaise: 100_000, balancePaise: 5_250_000 },
  ],
}

describe('financial calculations', () => {
  it('keeps the default demonstration statement reconciled', () => {
    const totals = calculateTotals(demoStatement.transactions)
    const reconciliation = getReconciliation(demoStatement)

    expect(demoStatement.openingBalancePaise).toBe(18_245_000)
    expect(totals.totalCreditsPaise).toBe(9_762_500)
    expect(totals.totalDebitsPaise).toBe(3_539_150)
    expect(demoStatement.closingBalancePaise).toBe(24_468_350)
    expect(totals.totalCreditsPaise - totals.totalDebitsPaise).toBe(6_223_350)
    expect(reconciliation.expectedClosingBalancePaise).toBe(24_468_350)
    expect(reconciliation.valid).toBe(true)
  })

  it('still detects an intentionally incorrect supplied closing balance', () => {
    const mismatched: Statement = {
      ...demoStatement,
      closingBalancePaise: 24_787_500,
    }
    const reconciliation = getReconciliation(mismatched)
    expect(reconciliation.valid).toBe(false)
    expect(reconciliation.expectedClosingBalancePaise).toBe(24_468_350)
    expect(reconciliation.differencePaise).toBe(319_150)
  })

  it('calculates integer paise totals and running balances', () => {
    expect(calculateTotals(validStatement.transactions)).toEqual({
      totalCreditsPaise: 350_000,
      totalDebitsPaise: 100_000,
    })
    expect(calculateRunningBalances(validStatement)).toEqual([
      { transactionId: 'credit-1', balancePaise: 5_350_000 },
      { transactionId: 'debit-1', balancePaise: 5_250_000 },
    ])
  })

  it('calculates running balances in chronological order', () => {
    const outOfOrder: Statement = {
      ...validStatement,
      transactions: [
        validStatement.transactions[1],
        validStatement.transactions[0],
      ],
    }
    expect(calculateRunningBalances(outOfOrder)).toEqual([
      { transactionId: 'credit-1', balancePaise: 5_350_000 },
      { transactionId: 'debit-1', balancePaise: 5_250_000 },
    ])
  })

  it('normalizes text fields and transaction types', () => {
    const result = normalizeStatement({
      ...validStatement,
      accountHolder: '  Aarav Mehta ',
      transactions: [{ ...validStatement.transactions[0], type: 'CREDIT' }],
    })
    expect(result.accountHolder).toBe('Aarav Mehta')
    expect(result.transactions[0].type).toBe('CREDIT')
  })

  it('rejects unknown transaction types', () => {
    expect(() => normalizeStatement({
      ...validStatement,
      transactions: [{ ...validStatement.transactions[0], type: 'TRANSFER' as never }],
    })).toThrow('Invalid transaction type')
  })

  it('masks account numbers', () => {
    expect(maskAccountNumber('4821')).toBe('•••• 4821')
    expect(maskAccountNumber('1234567890124821')).toBe('•••• 4821')
  })

  it('formats statement periods dynamically', () => {
    expect(formatStatementPeriod('2024-06-01', '2024-06-30')).toBe('01 Jun 2024 — 30 Jun 2024')
    expect(formatDate('2024-06-28')).toBe('28 Jun 2024')
    expect(formatStatementPeriod('2024-06-01', '2024-06-30', 'en-US'))
      .toBe('Jun 01, 2024 — Jun 30, 2024')
    expect(formatDate('2024-06-28', 'en-US')).toBe('Jun 28, 2024')
  })

  it('formats INR consistently for supported locales', () => {
    expect(formatCurrency(5_000_000, 'en-IN')).toBe('₹50,000.00')
    expect(formatCurrency(5_000_000, 'en-US')).toBe('₹50,000.00')
    expect(formatExportCurrency(5_000_000, 'en-IN')).toBe('INR 50,000.00')
    expect(formatExportCurrency(5_000_000, 'en-US')).toBe('INR 50,000.00')
  })

  it('reports the reconciliation difference', () => {
    const reconciliation = getReconciliation(validStatement)
    expect(reconciliation.valid).toBe(true)
    expect(reconciliation.expectedClosingBalancePaise).toBe(5_250_000)
    expect(reconciliation.differencePaise).toBe(0)
  })

  it('formats paise as INR', () => {
    expect(formatCurrency(5_000_000)).toBe('₹50,000.00')
  })

  it('accepts a consistent statement', () => {
    expect(validateStatement(validStatement).valid).toBe(true)
  })

  it('reports all requested statement inconsistencies', () => {
    const invalid: Statement = {
      ...validStatement,
      accountHolder: '',
      closingBalancePaise: 1,
      statementPeriod: { start: '2024-06-15', end: '2024-06-30' },
      transactions: [
        { ...validStatement.transactions[0], id: 'duplicate', balancePaise: 1 },
        { ...validStatement.transactions[1], id: 'duplicate', date: '2024-07-01', amountPaise: 1.5 },
      ],
    }
    const result = validateStatement(invalid)
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('Closing balance mismatch'))).toBe(true)
    expect(result.errors.some((error) => error.includes('Duplicate transaction ID'))).toBe(true)
    expect(result.errors.some((error) => error.includes('Invalid amount'))).toBe(true)
    expect(result.errors.some((error) => error.includes('outside the statement period'))).toBe(true)
    expect(result.errors.some((error) => error.includes('Incorrect running balance'))).toBe(true)
    expect(result.errors.some((error) => error.includes('accountHolder'))).toBe(true)
  })

  it('validates transaction types directly', () => {
    const invalidType = {
      ...validStatement,
      transactions: [
        { ...validStatement.transactions[0], type: 'TRANSFER' as never },
      ],
    }
    expect(validateStatement(invalidType).errors.some((error) =>
      error.includes('Invalid transaction type'),
    )).toBe(true)
  })

  it('accepts zero-value transactions and empty arrays', () => {
    const zero = { ...validStatement.transactions[0], amountPaise: 0 }
    expect(calculateTotals([zero])).toEqual({ totalCreditsPaise: 0, totalDebitsPaise: 0 })
    expect(calculateTotals([])).toEqual({ totalCreditsPaise: 0, totalDebitsPaise: 0 })
  })

  it('preserves source order for multiple transactions on the same date', () => {
    const sameDate: Statement = {
      ...validStatement,
      transactions: [
        { ...validStatement.transactions[0], id: 'same-1', date: '2024-06-10' },
        { ...validStatement.transactions[1], id: 'same-2', date: '2024-06-10' },
      ],
    }
    expect(calculateRunningBalances(sameDate)).toEqual([
      { transactionId: 'same-1', balancePaise: 5_350_000 },
      { transactionId: 'same-2', balancePaise: 5_250_000 },
    ])
  })

  it('supports large safe integer paise values', () => {
    const large = 900_000_000_000_000
    expect(formatCurrency(large)).toContain('₹')
  })

  it('rejects negative, fractional, and unsafe amounts', () => {
    expect(() => normalizeStatement({
      ...validStatement,
      transactions: [{ ...validStatement.transactions[0], amountPaise: -1 }],
    })).toThrow('amountPaise')
    expect(() => normalizeStatement({
      ...validStatement,
      transactions: [{ ...validStatement.transactions[0], amountPaise: 1.5 }],
    })).toThrow('amountPaise')
    expect(() => normalizeStatement({
      ...validStatement,
      transactions: [{ ...validStatement.transactions[0], amountPaise: Number.MAX_SAFE_INTEGER + 1 }],
    })).toThrow('amountPaise')
  })

  it('rejects impossible and malformed dates', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true)
    expect(isValidIsoDate('2023-02-29')).toBe(false)
    expect(isValidIsoDate('2024-13-01')).toBe(false)
    expect(() => normalizeStatement({
      ...validStatement,
      transactions: [{ ...validStatement.transactions[0], date: '2024-02-30' }],
    })).toThrow('Invalid date')
  })

  it('detects arithmetic overflow in totals and running balances', () => {
    expect(() => calculateTotals([
      { ...validStatement.transactions[0], amountPaise: Number.MAX_SAFE_INTEGER },
      { ...validStatement.transactions[0], amountPaise: 1 },
    ])).toThrow('Arithmetic overflow')
    expect(() => calculateRunningBalances({
      ...validStatement,
      openingBalancePaise: Number.MAX_SAFE_INTEGER,
      transactions: [{ ...validStatement.transactions[0], amountPaise: 1 }],
    })).toThrow('Arithmetic overflow')
  })
})
