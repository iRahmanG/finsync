import { describe, expect, it } from 'vitest'
import { render, validate, outline } from '@hyper-elements/react'
import { StatementEmailDocument } from './renderers/StatementEmail'
import { PdfDocument } from './renderers/PdfStatement'
import { CanvasDocument } from './renderers/CanvasSummary'
import {
  emptyStatement,
  longDescriptionStatement,
  manyTransactionStatement,
  mismatchStatement,
  reconciledStatement,
} from './test-fixtures'
import { calculateTotals, getReconciliation, maskAccountNumber, validateStatement } from './financial'

const fixtures = [
  ['normal', reconciledStatement],
  ['mismatch', mismatchStatement],
  ['empty', emptyStatement],
  ['many', manyTransactionStatement],
  ['long', longDescriptionStatement],
] as const

describe('cross-format renderer regressions', () => {
  for (const [name, statement] of fixtures) {
    it(`keeps ${name} statement values consistent`, async () => {
      const validation = validateStatement(statement)
      const totals = calculateTotals(statement.transactions)
      const reconciliation = getReconciliation(statement)

      expect(totals.totalCreditsPaise).toBeGreaterThanOrEqual(0)
      expect(totals.totalDebitsPaise).toBeGreaterThanOrEqual(0)
      expect(reconciliation.expectedClosingBalancePaise).toBe(
        statement.openingBalancePaise +
        totals.totalCreditsPaise -
        totals.totalDebitsPaise,
      )

      const email = StatementEmailDocument({ statement })
      const emailValidation = validate(email)
      if (!emailValidation.valid) {
        throw new Error(JSON.stringify(emailValidation.diagnostics, null, 2))
      }
      expect(emailValidation.valid).toBe(true)

      const emailRender = await render(email)
      expect(emailRender.html).not.toContain('1234567890121234')
      expect(emailRender.html).toContain(maskAccountNumber(statement.accountNumber))

      const pdf = PdfDocument({ statement })
      const pdfValidation = validate(pdf)
      if (!pdfValidation.valid) {
        throw new Error(JSON.stringify(pdfValidation.diagnostics, null, 2))
      }
      expect(pdfValidation.valid).toBe(true)

      const pdfOutline = outline(pdf)
      expect(pdfOutline).toContain('FinSync')

      const canvas = CanvasDocument({ statement })
      const canvasValidation = validate(canvas)
      expect(canvasValidation.valid).toBe(true)

      const canvasOutline = outline(canvas)
      expect(canvasOutline).toContain('Net cash flow')

      if (name === 'mismatch') {
        expect(validation.valid).toBe(false)
        expect(reconciliation.valid).toBe(false)
      }
      if (name === 'empty') {
        expect(statement.transactions).toHaveLength(0)
        expect(emailRender.html).toContain('No transactions')
        expect(pdfOutline).toContain('No transactions')
        expect(canvasOutline).toContain('No debit transactions')
      }
    })
  }
})
