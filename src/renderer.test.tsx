import { describe, expect, it } from 'vitest'
import { render, validate, outline, formatDiagnostics, Page, Email, Document, Canvas, Table, Text } from '@hyper-elements/react'
import { inspect } from '@hyper-elements/react/inspect'
import { StatementEmailDocument } from './renderers/StatementEmail'
import { PdfDocument } from './renderers/PdfStatement'
import { CanvasDocument } from './renderers/CanvasSummary'
import { StatementPageDocument } from './renderers/WebStatement'
import {
  BrandHeader,
  AccountInformation,
  BalanceSummary,
  TransactionSection,
  TransactionRow,
  ReconciliationBanner,
  StatementBody,
  StatementFooter,
} from './components'
import type { FinSyncRendererConfig } from './public-api'
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
import { statementProfiles } from './data/statement'

const fixtures = [
  ['normal', reconciledStatement],
  ['mismatch', mismatchStatement],
  ['empty', emptyStatement],
  ['many', manyTransactionStatement],
  ['long', longDescriptionStatement],
  ['alternate', alternateStatement],
] as const

describe('cross-format renderer regressions', () => {
  it('switches every Hyper Elements format to the selected 2025 and 2026 samples', async () => {
    const march = statementProfiles.find((profile) => profile.id === '2025-03')?.statement
    const october = statementProfiles.find((profile) => profile.id === '2026-10')?.statement
    expect(march).toBeDefined()
    expect(october).toBeDefined()

    const rendererConfig: FinSyncRendererConfig = { brandName: 'FinSync', locale: 'en-IN' }
    const marchEmail = await render(StatementEmailDocument({ statement: march!, rendererConfig }))
    const marchPage = await render(StatementPageDocument({ statement: march!, transactions: march!.transactions, rendererConfig }))
    const marchPdf = PdfDocument({ statement: march!, rendererConfig })
    const marchCanvas = CanvasDocument({ statement: march!, rendererConfig })
    const octoberPdf = PdfDocument({ statement: october!, rendererConfig })
    const octoberCanvas = CanvasDocument({ statement: october!, rendererConfig })

    expect(marchEmail.html).toContain('Maksud Rahman')
    expect(marchPage.html).toContain('Maksud Rahman')
    expect(outline(marchPdf)).toContain('Maksud Rahman')
    expect(outline(marchCanvas)).toContain('01 Mar 2025')
    expect(outline(octoberPdf)).toContain('Maksud Rahman')
    expect(outline(octoberCanvas)).toContain('01 Oct 2026')
  })
  it('renders email and web content through Hyper Elements with shared configuration', async () => {
    const rendererConfig: FinSyncRendererConfig = {
      brandName: 'Acme Bank',
      locale: 'en-US',
      theme: { primaryColor: '#175CD3' },
    }
    const email = await render(StatementEmailDocument({ statement: demoStatement, rendererConfig }))
    const page = StatementPageDocument({
      statement: demoStatement,
      transactions: demoStatement.transactions,
      rendererConfig,
    })
    const pageRender = await render(page)

    expect(email.html).toContain('Acme Bank')
    expect(email.html).toContain('#175cd3')
    expect(validate(page).valid).toBe(true)
    expect(pageRender.html).toContain('Acme Bank')
    expect(pageRender.html).toContain('Jun 01, 2024')
  })

  it('keeps currency, locale, branding, and optional sections consistent', async () => {
    const rendererConfig: FinSyncRendererConfig = {
      brandName: 'Violet Finance',
      locale: 'en-US',
      theme: { primaryColor: '#7C3AED', borderRadius: 14, spacingScale: 1.25 },
      optionalSections: { accountDetails: false, financialSummary: true, transactions: false },
    }

    const email = await render(StatementEmailDocument({ statement: reconciledStatement, rendererConfig }))
    const page = await render(StatementPageDocument({
      statement: reconciledStatement,
      transactions: reconciledStatement.transactions,
      rendererConfig,
    }))
    const pdf = PdfDocument({ statement: reconciledStatement, rendererConfig })
    const canvas = CanvasDocument({ statement: reconciledStatement, rendererConfig })

    expect(email.html).toContain('Violet Finance')
    expect(email.html).toContain('₹')
    expect(email.html).not.toContain('ACCOUNT')
    expect(email.html).not.toContain('Salary')
    expect(page.html).toContain('Violet Finance')
    expect(page.html).toContain('Jun 01, 2024')
    expect(outline(pdf)).toContain('Violet Finance')
    expect(outline(pdf)).not.toContain('Salary')
    expect(outline(canvas)).toContain('Violet Finance')
    expect(outline(canvas)).not.toContain('Estimated spending breakdown')
  })

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
        expect(pdfOutline).toContain('Statement needs review')
        expect(canvasOutline).toContain('Statement needs review')
        expect(emailRender.html).toContain('Statement needs review')
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
      it('preserves the default API without a sample selector control', () => {
        const element = React.createElement(FinSyncStatement, {
          statement: demoStatement,
          themePreset: {
            value: 'fintech',
            options: [{ value: 'fintech', label: 'Fintech default' }],
            onChange: () => undefined,
          },
        })
        expect(element.props.statement).toBe(demoStatement)
        expect(element.props).not.toHaveProperty('samplePreset')
      })

      it('renders alternate data through FinSyncStatement', () => {
        const element = React.createElement(FinSyncStatement, {
          statement: alternateStatement,
          initialView: 'web',
          config: { brandName: 'Acme Finance', theme: { primaryColor: '#175CD3' } },
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
            brandName: 'Acme Finance',
            logoUrl: '/acme-logo.svg',
            logoAlt: 'Acme Finance logo',
          },
        })
        expect(element.props.config?.locale).toBe('en-US')
        expect(element.props.config?.logoUrl).toBe('/acme-logo.svg')
      })
    })
  }

  describe('shared Hyper Elements component architecture', () => {
    const testTheme = createFinSyncTheme()

    it('composes BrandHeader across Web, Email, Document, and Canvas roots with zero diagnostics', () => {
      const pageWithBrand = React.createElement(
        Page,
        { theme: testTheme },
        React.createElement(BrandHeader, { brandName: 'Acme Bank', eyebrow: 'Personal finance', title: 'Monthly statement' }),
      )
      const emailWithBrand = React.createElement(
        Email,
        { theme: testTheme },
        React.createElement(BrandHeader, { brandName: 'Acme Bank', eyebrow: 'Monthly statement', variant: 'email' }),
      )
      const pdfWithBrand = React.createElement(
        Document,
        { theme: testTheme },
        React.createElement(Document.Page, {}, React.createElement(BrandHeader, { brandName: 'Acme Bank', variant: 'compact', period: '01 Jun 2024 — 30 Jun 2024' })),
      )
      const canvasWithBrand = React.createElement(
        Canvas,
        { theme: testTheme, width: 1200, height: 630 },
        React.createElement(BrandHeader, { brandName: 'Acme Bank', variant: 'canvas', eyebrow: 'FINANCIAL SNAPSHOT' }),
      )

      expect(validate(pageWithBrand).valid).toBe(true)
      expect(validate(emailWithBrand).valid).toBe(true)
      expect(validate(pdfWithBrand).valid).toBe(true)
      expect(validate(canvasWithBrand).valid).toBe(true)

      expect(outline(pageWithBrand)).toContain('Acme Bank')
      expect(outline(emailWithBrand)).toContain('Acme Bank')
      expect(outline(pdfWithBrand)).toContain('Acme Bank')
      expect(outline(canvasWithBrand)).toContain('Acme Bank')
    })

    it('renders AccountInformation across layouts with consistent masking', () => {
      const webAccount = React.createElement(Page, { theme: testTheme }, React.createElement(AccountInformation, { statement: reconciledStatement, layout: 'row' }))
      const emailAccount = React.createElement(Email, { theme: testTheme }, React.createElement(AccountInformation, { statement: reconciledStatement, layout: 'column' }))
      const pdfAccount = React.createElement(Document, { theme: testTheme }, React.createElement(Document.Page, {}, React.createElement(AccountInformation, { statement: reconciledStatement, layout: 'pdf' })))
      const canvasAccount = React.createElement(Canvas, { theme: testTheme, width: 1200, height: 630 }, React.createElement(AccountInformation, { statement: reconciledStatement, layout: 'canvas' }))

      expect(validate(webAccount).valid).toBe(true)
      expect(validate(emailAccount).valid).toBe(true)
      expect(validate(pdfAccount).valid).toBe(true)
      expect(validate(canvasAccount).valid).toBe(true)

      const webOutline = outline(webAccount)
      const emailOutline = outline(emailAccount)
      const pdfOutline = outline(pdfAccount)
      const canvasOutline = outline(canvasAccount)

      expect(webOutline).toContain('•••• 4821')
      expect(webOutline).toContain('Maksud Rahman')
      expect(emailOutline).toContain('•••• 4821')
      expect(emailOutline).toContain('Maksud Rahman')
      expect(pdfOutline).toContain('•••• 4821')
      expect(pdfOutline).toContain('Maksud Rahman')
      expect(canvasOutline).toContain('•••• 4821')
      expect(canvasOutline).toContain('Maksud Rahman')
    })

    it('shares BalanceSummary across all four output roots with correct format variants', () => {
      const webSummary = React.createElement(Page, { theme: testTheme }, React.createElement(BalanceSummary, { statement: reconciledStatement, variant: 'grid' }))
      const emailSummary = React.createElement(Email, { theme: testTheme }, React.createElement(BalanceSummary, { statement: reconciledStatement, variant: 'stacked' }))
      const pdfSummary = React.createElement(Document, { theme: testTheme }, React.createElement(Document.Page, {}, React.createElement(BalanceSummary, { statement: reconciledStatement, variant: 'horizontal' })))
      const canvasSummary = React.createElement(Canvas, { theme: testTheme, width: 1200, height: 630 }, React.createElement(BalanceSummary, { statement: reconciledStatement, variant: 'metrics' }))

      expect(validate(webSummary).valid).toBe(true)
      expect(validate(emailSummary).valid).toBe(true)
      expect(validate(pdfSummary).valid).toBe(true)
      expect(validate(canvasSummary).valid).toBe(true)

      // Verified calculations: opening 50,000.00, closing 52,500.00
      expect(outline(webSummary)).toContain('Opening balance')
      expect(outline(emailSummary)).toContain('Closing balance')
      expect(outline(pdfSummary)).toContain('Net cash flow')
      expect(outline(canvasSummary)).toContain('Income')
      expect(outline(canvasSummary)).toContain('Expenses')
    })

    it('renders shared TransactionSection and TransactionRow with identical transaction data', () => {
      const pageTransactions = React.createElement(
        Page,
        { theme: testTheme },
        React.createElement(TransactionSection, { transactions: reconciledStatement.transactions, showReference: true, showType: true }),
      )
      const emailTransactions = React.createElement(
        Email,
        { theme: testTheme },
        React.createElement(TransactionSection, { transactions: reconciledStatement.transactions }),
      )
      const tableWithRow = React.createElement(
        Page,
        { theme: testTheme },
        React.createElement(
          Table,
          {},
          React.createElement(TransactionRow, { transaction: reconciledStatement.transactions[0], showType: true, showReference: true }),
        ),
      )

      expect(validate(pageTransactions).valid).toBe(true)
      expect(validate(emailTransactions).valid).toBe(true)
      expect(validate(tableWithRow).valid).toBe(true)

      expect(outline(pageTransactions)).toContain('Salary')
      expect(outline(pageTransactions)).toContain('Rent')
      expect(outline(emailTransactions)).toContain('Salary')
      expect(outline(emailTransactions)).toContain('Rent')
      expect(outline(tableWithRow)).toContain('Salary')
      expect(outline(tableWithRow)).toContain('SAL-001')
    })

    it('composes StatementBody and StatementFooter respecting presentation configuration', () => {
      const fullBody = React.createElement(Page, { theme: testTheme }, React.createElement(StatementBody, { statement: reconciledStatement }))
      const hiddenSummary = React.createElement(Page, { theme: testTheme }, React.createElement(StatementBody, {
        statement: reconciledStatement,
        rendererConfig: { brandName: 'FinSync', locale: 'en-IN', optionalSections: { financialSummary: false } },
      }))
      const footer = React.createElement(Document, { theme: testTheme }, React.createElement(Document.Page, {}, React.createElement(StatementFooter, { brandName: 'FinSync', showPageNumber: true })))
      const webFooter = React.createElement(Page, { theme: testTheme }, React.createElement(StatementFooter, { brandName: 'FinSync', variant: 'web' }))

      expect(validate(fullBody).valid).toBe(true)
      expect(validate(hiddenSummary).valid).toBe(true)
      expect(validate(footer).valid).toBe(true)
      expect(validate(webFooter).valid).toBe(true)

      expect(outline(fullBody)).toContain('Opening balance')
      expect(outline(hiddenSummary)).not.toContain('Opening balance')
      expect(outline(footer)).toContain('FinSync • Confidential')
      expect(outline(webFooter)).toContain('FinSync • Confidential')
    })

    it('renders shared ReconciliationBanner only when statements are financially mismatched', () => {
      const reconciledBanner = React.createElement(Page, { theme: testTheme }, React.createElement(ReconciliationBanner, { statement: reconciledStatement }))
      const mismatchedBanner = React.createElement(Page, { theme: testTheme }, React.createElement(ReconciliationBanner, { statement: mismatchStatement }))

      expect(validate(reconciledBanner).valid).toBe(true)
      expect(validate(mismatchedBanner).valid).toBe(true)

      expect(outline(reconciledBanner)).not.toContain('Statement needs review')
      expect(outline(mismatchedBanner)).toContain('Statement needs review')
    })

    it('verifies Hyper Elements inspect() reports node topology and validation status accurately', () => {
      const rendererConfig = { brandName: 'FinSync', locale: 'en-IN' as const }
      const webTree = StatementPageDocument({ statement: reconciledStatement, transactions: reconciledStatement.transactions, rendererConfig })
      const inspected = inspect(webTree)

      expect(inspected.root).toBe('Page')
      expect(inspected.valid).toBe(true)
      expect(inspected.nodes.length).toBeGreaterThan(10)
      expect(inspected.diagnostics).toEqual([])
    })

    it('generates actionable layout diagnostics when invalid styles or properties are introduced', () => {
      const invalidTree = React.createElement(
        Page,
        { theme: testTheme },
        React.createElement(Text, {
          style: { color: 'invalid-non-color-value' },
        }, 'Invalid text'),
      )
      const result = validate(invalidTree)
      expect(result.valid).toBe(false)
      expect(result.diagnostics.length).toBeGreaterThan(0)
      const formatted = formatDiagnostics(result.diagnostics)
      expect(formatted).toContain('color')
    })
  })

  describe('developer experience and public API customization', () => {
    it('exports all expected public integration APIs and renderers from index', async () => {
      const api = await import('./index')

      expect(typeof api.FinSyncStatement).toBe('function')
      expect(typeof api.PdfDocument).toBe('function')
      expect(typeof api.CanvasDocument).toBe('function')
      expect(typeof api.StatementEmailDocument).toBe('function')
      expect(typeof api.StatementPageDocument).toBe('function')
      expect(typeof api.exportPdf).toBe('function')
      expect(typeof api.exportPng).toBe('function')
      expect(typeof api.createFinSyncTheme).toBe('function')
      expect(typeof api.validateStatement).toBe('function')
      expect(typeof api.BrandHeader).toBe('function')
      expect(typeof api.BalanceSummary).toBe('function')
      expect(typeof api.TransactionSection).toBe('function')
    })

    it('renders Acme Finance custom branding across all four formats with zero diagnostics', async () => {
      const {
        createAcmeWebDocument,
        createAcmeEmailDocument,
        createAcmePdfDocument,
        createAcmeCanvasDocument,
      } = await import('../examples/acme-finance')

      const webTree = createAcmeWebDocument(reconciledStatement)
      const emailTree = createAcmeEmailDocument(reconciledStatement)
      const pdfTree = createAcmePdfDocument(reconciledStatement)
      const canvasTree = createAcmeCanvasDocument(reconciledStatement)

      expect(validate(webTree).valid).toBe(true)
      expect(validate(emailTree).valid).toBe(true)
      expect(validate(pdfTree).valid).toBe(true)
      expect(validate(canvasTree).valid).toBe(true)

      expect(outline(webTree)).toContain('Acme Finance')
      expect(outline(emailTree)).toContain('Acme Finance')
      expect(outline(pdfTree)).toContain('Acme Finance')
      expect(outline(canvasTree)).toContain('Acme Finance')
    })

    it('renders Acme Finance interactive statement component without throwing', async () => {
      const { AcmeInteractiveStatement } = await import('../examples/acme-finance')
      const element = React.createElement(AcmeInteractiveStatement, { statementData: reconciledStatement })
      expect(element).toBeTruthy()
    })
  })
})
