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
  alternateStatement,
} from './test-fixtures'
import { calculateTotals, getReconciliation, maskAccountNumber, validateStatement } from './financial'
import { statementFilename } from './export'
import { categoryFor } from './financial'
import { createFinSyncTheme } from './theme'
import { FinSyncStatement } from './FinSyncStatement'
import React from 'react'
import { statement as demoStatement } from './data/statement'
import type { Statement } from './types'

const fixtures = [
  ['normal', reconciledStatement],
  ['mismatch', mismatchStatement],
  ['empty', emptyStatement],
  ['many', manyTransactionStatement],
  ['long', longDescriptionStatement],
  ['alternate', alternateStatement],
] as const

describe('cross-format renderer regressions', () => {
  it('uses reconciled demo data and FinSync branding across renderers', () => {
    expect(validateStatement(demoStatement).valid).toBe(true)

    const email = StatementEmailDocument({ statement: demoStatement })
    const pdf = PdfDocument({ statement: demoStatement, brandName: 'FinSync' })
    const canvas = CanvasDocument({ statement: demoStatement, brandName: 'FinSync' })

    expect(validate(email).valid).toBe(true)
    expect(validate(pdf).valid).toBe(true)
    expect(validate(canvas).valid).toBe(true)
    expect(outline(pdf)).toContain('FinSync')
    expect(outline(canvas)).toContain('FinSync')
  })

  it('does not bypass reconciliation through theme or presentation config', () => {
    const mismatched: Statement = {
      ...demoStatement,
      closingBalancePaise: 24_787_500,
    }
    const element = React.createElement(FinSyncStatement, {
      statement: mismatched,
      config: {
        brandName: 'FinSync',
        locale: 'en-US',
        theme: { primaryColor: '#7C3AED', borderRadius: 14 },
      },
    })

    expect(element.props.statement).toBe(mismatched)
    expect(validateStatement(mismatched).valid).toBe(false)
  })

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

    describe('export filenames', () => {
      it('uses the statement period in PDF and PNG filenames', () => {
        expect(statementFilename({ start: '2024-06-01', end: '2024-06-30' }, 'pdf'))
          .toBe('finsync-statement-20240601-20240630.pdf')
        expect(statementFilename({ start: '2024-06-01', end: '2024-06-30' }, 'png'))
          .toBe('finsync-summary-20240601-20240630.png')
      })
    })

    describe('spending category heuristic', () => {
      it('uses Uncategorized for descriptions without known keywords', () => {
        expect(categoryFor('Merchant label not covered by the template')).toBe('Uncategorized')
      })
    })

    describe('public integration API', () => {
      it('renders alternate data through FinSyncStatement', () => {
        const element = React.createElement(FinSyncStatement, {
          statement: alternateStatement,
          initialView: 'web',
          config: { brandName: 'Northstar', theme: { primaryColor: '#175CD3' } },
        })
        expect(element.type).toBe(FinSyncStatement)
        expect(element.props.statement).toBe(alternateStatement)
        expect(validateStatement(alternateStatement).valid).toBe(true)
      })

      it('creates an extended theme with custom colors', () => {
        const customTheme = createFinSyncTheme({
          primaryColor: '#175CD3',
          textColor: '#101828',
        })
        expect(customTheme).toBeDefined()

        const warmTheme = createFinSyncTheme({
          primaryColor: '#7C3AED',
          surfaceColor: '#FFFCF7',
          borderRadius: 14,
          spacingScale: 1.25,
        })
        expect(warmTheme).toBeDefined()
      })

      it('accepts optional logo and locale configuration', () => {
        const element = React.createElement(FinSyncStatement, {
          statement: alternateStatement,
          config: {
            locale: 'en-US',
            brandName: 'Northstar',
            logoUrl: '/logo.svg',
            logoAlt: 'Northstar logo',
          },
        })
        expect(element.props.config?.locale).toBe('en-US')
        expect(element.props.config?.logoUrl).toBe('/logo.svg')
      })
    })
  }
})
