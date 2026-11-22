import { calculateRunningBalances, calculateTotals, formatDate, formatExportCurrency, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import {
  Column,
  Document,
  Image,
  PageFooter,
  PageHeader,
  PageNumber,
  Row,
  Table,
  TableCell,
  TableRow,
  Text,
} from '@hyper-elements/react'
import { createFinSyncTheme, token } from '../theme'
import { exportPdf } from '../export'
import { useState } from 'react'
import type { FinSyncLocale, FinSyncRendererConfig } from '../public-api'
import * as React from 'react'
void React
import { HyperPreview } from './HyperPreview'

interface PdfStatementProps {
  statement: Statement
  onClose?: () => void
  locale?: FinSyncLocale
  brandName?: string
  logoUrl?: string
  logoAlt?: string
  rendererConfig?: FinSyncRendererConfig
}

const ROWS_PER_PAGE = 10

export function PdfStatement({ statement, onClose, locale = 'en-IN', brandName = 'FinSync', logoUrl, logoAlt, rendererConfig }: PdfStatementProps) {
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')

  const handleExport = async () => {
    setExportState('loading')
    setExportMessage('')
    try {
      await exportPdf(PdfDocument({ statement, rendererConfig: rendererConfig ?? { brandName, locale } }), statement, rendererConfig)
      setExportState('success')
      setExportMessage('PDF download started.')
    } catch (error) {
      setExportState('error')
      setExportMessage(error instanceof Error ? error.message : 'PDF export failed.')
    }
  }

  return (
    <div className="pdf-preview">
      <div className="pdf-toolbar no-print">
        <div><p className="eyebrow">PDF STATEMENT</p><h1>Print-ready A4 statement</h1></div>
        <div className="pdf-actions">
          {onClose && <button className="secondary-button" type="button" onClick={onClose}>Back to web</button>}
          <button className="download-button" type="button" onClick={handleExport} disabled={exportState === 'loading'}>
            {exportState === 'loading' ? 'Preparing PDF…' : '↓ Download PDF'}
          </button>
        </div>
      </div>
      {exportMessage && <p className={exportState === 'error' ? 'export-message error' : 'export-message'} role={exportState === 'error' ? 'alert' : 'status'}>{exportMessage}</p>}
      <div className="pdf-document">
        <HyperPreview
          title="Generated PDF statement preview"
          element={PdfDocument({ statement, rendererConfig: rendererConfig ?? { brandName, locale, logoUrl, logoAlt } })}
        />
      </div>
    </div>
  )
}

export function PdfDocument({
  statement,
  locale = 'en-IN',
  brandName = 'FinSync',
  rendererConfig,
}: { statement: Statement; locale?: FinSyncLocale; brandName?: string; rendererConfig?: FinSyncRendererConfig }) {
  const resolvedConfig = rendererConfig ?? { brandName, locale }
  const resolvedLocale = resolvedConfig.locale
  const resolvedBrandName = resolvedConfig.brandName
  const optionalSections = resolvedConfig.optionalSections
  const balances = calculateRunningBalances(statement)
  const totals = calculateTotals(statement.transactions)
  const netCashFlowPaise = totals.totalCreditsPaise - totals.totalDebitsPaise
  const chronologicalTransactions = [...statement.transactions].sort((first, second) =>
    first.date.localeCompare(second.date),
  )
  const pages = Array.from(
    { length: Math.ceil(chronologicalTransactions.length / ROWS_PER_PAGE) },
    (_, pageIndex) => chronologicalTransactions.slice(pageIndex * ROWS_PER_PAGE, (pageIndex + 1) * ROWS_PER_PAGE),
  )
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
    resolvedLocale,
  )
  const documentPages = pages.length === 0 ? [[]] : pages

  return (
    <Document
          theme={createFinSyncTheme(resolvedConfig.theme)}
          fonts={[{ family: 'Noto Sans', src: '/fonts/NotoSans-Regular.ttf', format: 'truetype', weight: 400 }]}
          size="A4"
          margin={{ top: 36, right: 40, bottom: 36, left: 40 }}
          title={`${resolvedBrandName} account statement`}
          style={{ gap: 12, color: token('colors.ink'), fontFamily: 'Noto Sans, Arial, sans-serif', backgroundColor: token('colors.surface') }}
        >
          <PageHeader style={{ padding: { bottom: 16 }, border: { bottom: { width: 1, style: 'solid', color: token('colors.line') } } }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ gap: 8, alignItems: 'center' }}>
                {resolvedConfig.logoUrl && <Image src={resolvedConfig.logoUrl} alt={resolvedConfig.logoAlt || `${resolvedBrandName} logo`} style={{ width: 24, height: 24 }} />}
                <Text style={{ fontSize: 16, fontWeight: 700, color: token('colors.primary') }}>{resolvedBrandName}</Text>
              </Row>
              <Text style={{ fontSize: 10, color: token('colors.muted') }}>
                {statementPeriod}
              </Text>
            </Row>
          </PageHeader>
          {documentPages.map((page, pageIndex) => (
            <Document.Page key={pageIndex} style={{ gap: 10 }}>
              {pageIndex === 0 && (
                <>
                  {optionalSections?.accountDetails !== false && <Row style={{ gap: 12, padding: { top: 6, bottom: 6 } }}>
                    <Column style={{ flex: 1.3, gap: 2 }}>
                      <Text style={{ fontSize: 8, color: token('colors.muted') }}>ACCOUNT HOLDER</Text>
                      <Text style={{ fontSize: 10, fontWeight: 700 }}>{statement.accountHolder}</Text>
                    </Column>
                    <Column style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 8, color: token('colors.muted') }}>ACCOUNT</Text>
                      <Text style={{ fontSize: 10, fontWeight: 700 }}>{maskAccountNumber(statement.accountNumber)}</Text>
                    </Column>
                    <Column style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 8, color: token('colors.muted') }}>TYPE</Text>
                      <Text style={{ fontSize: 10, fontWeight: 700 }}>{statement.accountType}</Text>
                    </Column>
                    <Column style={{ flex: 1.2, gap: 2 }}>
                      <Text style={{ fontSize: 8, color: token('colors.muted') }}>STATEMENT PERIOD</Text>
                      <Text style={{ fontSize: 9, fontWeight: 700 }}>{statementPeriod}</Text>
                    </Column>
                  </Row>}
                  {optionalSections?.financialSummary !== false && <Row style={{ gap: 8 }}>
                    <PdfSummaryCell label="Opening balance" value={formatExportCurrency(statement.openingBalancePaise, resolvedLocale)} />
                    <PdfSummaryCell label="Closing balance" value={formatExportCurrency(statement.closingBalancePaise, resolvedLocale)} />
                    <PdfSummaryCell label="Total credits" value={formatExportCurrency(totals.totalCreditsPaise, resolvedLocale)} />
                    <PdfSummaryCell label="Total debits" value={formatExportCurrency(totals.totalDebitsPaise, resolvedLocale)} />
                    <PdfSummaryCell label="Net cash flow" value={formatExportCurrency(netCashFlowPaise, resolvedLocale)} />
                  </Row>}
                </>
              )}
              {optionalSections?.transactions !== false && <Table style={{ width: '100%', fontSize: 9, border: { width: 1, style: 'solid', color: token('colors.line') }, cellPadding: [10, 6] }}>
                <TableRow header>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Amount</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Running balance</TableCell>
                </TableRow>
                {page.map((transaction) => {
                  const runningBalance = balances.find(({ transactionId }) => transactionId === transaction.id)
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date, resolvedLocale)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell style={{ color: transaction.type === 'CREDIT' ? token('colors.primary') : token('colors.debit') }}>{transaction.type}</TableCell>
                      <TableCell style={{ textAlign: 'right', color: transaction.type === 'CREDIT' ? token('colors.primary') : token('colors.debit') }}>
                        {transaction.type === 'CREDIT' ? '+' : '-'} {formatExportCurrency(transaction.amountPaise, resolvedLocale)}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>{formatExportCurrency(runningBalance?.balancePaise ?? statement.openingBalancePaise, resolvedLocale)}</TableCell>
                    </TableRow>
                  )
                })}
              </Table>}
              {optionalSections?.transactions !== false && page.length === 0 && (
                <Text style={{ padding: 18, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md'), backgroundColor: token('colors.surfaceSubtle'), color: token('colors.muted'), fontSize: 11, textAlign: 'center' }}>
                  No transactions were recorded for this statement period.
                </Text>
              )}
              {pageIndex === documentPages.length - 1 && optionalSections?.financialSummary !== false && <PdfClosingSummary statement={statement} locale={resolvedLocale} />}
            </Document.Page>
          ))}
          <PageFooter style={{ border: { top: { width: 1, style: 'solid', color: token('colors.line') } }, padding: { top: 10 } }}>
            <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: token('colors.muted') }}>{resolvedBrandName} • Confidential</Text>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>Synthetic demonstration</Text>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>Page <PageNumber /></Text>
            </Row>
          </PageFooter>
    </Document>
  )
}

function PdfSummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <Column style={{ flex: 1, gap: token('spacing.xs'), padding: token('spacing.sm'), border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.sm'), backgroundColor: token('colors.surfaceSubtle') }}>
      <Text style={{ fontSize: 7, color: token('colors.muted') }}>{label}</Text>
      <Text style={{ fontSize: 9, fontWeight: 700 }}>{value}</Text>
    </Column>
  )
}

function PdfClosingSummary({ statement, locale }: { statement: Statement; locale: FinSyncLocale }) {
  const reconciliation = getReconciliation(statement)
  const mismatch = reconciliation.differencePaise

  return (
    <Column style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', padding: { top: 12 }, border: { top: { width: 2, style: 'solid', color: token('colors.ink') } } }}>
        <Text style={{ fontSize: 12 }}>Closing balance</Text>
        <Text style={{ fontSize: 12, fontWeight: 700 }}>{formatExportCurrency(statement.closingBalancePaise, locale)}</Text>
      </Row>
      {!reconciliation.valid && (
        <Text style={{ padding: 8, border: { width: 1, style: 'solid', color: '#9A6700' }, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 9, lineHeight: 1.4 }}>
          Statement needs review: calculated closing balance {formatExportCurrency(reconciliation.expectedClosingBalancePaise, locale)};
          {' '}{mismatch > 0 ? 'over' : 'under'} by {formatExportCurrency(Math.abs(mismatch), locale)}.
        </Text>
      )}
    </Column>
  )
}
