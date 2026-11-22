import { calculateRunningBalances, formatExportCurrency, formatStatementPeriod } from '../financial'
import type { Statement } from '../types'
import {
  Column,
  Document,
  PageFooter,
  PageHeader,
  Row,
  Text,
} from '@hyper-elements/react'
import { createFinSyncTheme, token } from '../theme'
import { exportPdf } from '../export'
import { useState } from 'react'
import type { FinSyncLocale, FinSyncRendererConfig } from '../public-api'
import * as React from 'react'
void React
import { HyperPreview } from './HyperPreview'
import {
  AccountInformation,
  BalanceSummary,
  BrandHeader,
  ReconciliationBanner,
  StatementFooter,
  TransactionSection,
} from '../components'

interface PdfStatementProps {
  statement: Statement
  onClose?: () => void
  locale?: FinSyncLocale
  brandName?: string
  logoUrl?: string
  logoAlt?: string
  rendererConfig?: FinSyncRendererConfig
}

const ROWS_PER_PAGE = 12

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
  const balancesById = new Map(balances.map(({ transactionId, balancePaise }) => [transactionId, balancePaise]))

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
      fonts={[
        { family: 'Noto Sans', src: '/fonts/NotoSans-Regular.ttf', format: 'truetype', weight: 400 },
        { family: 'Noto Sans', src: '/fonts/NotoSans-Bold.ttf', format: 'truetype', weight: 700 },
      ]}
      size="A4"
      margin={{ top: 36, right: 36, bottom: 36, left: 36 }}
      title={`${resolvedBrandName} account statement`}
      style={{
        gap: 14,
        color: token('colors.ink'),
        fontFamily: 'Noto Sans, Arial, sans-serif',
        backgroundColor: token('colors.surface'),
      }}
    >
      <PageHeader
        style={{
          padding: { bottom: 14 },
          border: { bottom: { width: 1, style: 'solid', color: token('colors.line') } },
        }}
      >
        <BrandHeader
          brandName={resolvedBrandName}
          logoUrl={resolvedConfig.logoUrl}
          logoAlt={resolvedConfig.logoAlt}
          period={statementPeriod}
          variant="compact"
        />
      </PageHeader>
      {documentPages.map((page, pageIndex) => (
        <Document.Page key={pageIndex} style={{ gap: 12 }}>
          {pageIndex === 0 && (
            <>
              {optionalSections?.accountDetails !== false && (
                <AccountInformation
                  statement={statement}
                  locale={resolvedLocale}
                  layout="pdf"
                />
              )}
              {optionalSections?.financialSummary !== false && (
                <BalanceSummary
                  statement={statement}
                  locale={resolvedLocale}
                  variant="horizontal"
                />
              )}
            </>
          )}
          {optionalSections?.transactions !== false && (
            <TransactionSection
              transactions={page}
              locale={resolvedLocale}
              showReference={true}
              showType={true}
              showRunningBalance={true}
              balancesById={balancesById}
              fallbackRunningBalance={statement.openingBalancePaise}
              closingBalancePaise={pageIndex === documentPages.length - 1 ? statement.closingBalancePaise : undefined}
              cellPadding={[11, 7]}
              fontSize={10}
              useExportCurrency={true}
              emptyMessage={
                page.length === 0
                  ? 'No transactions were recorded for this statement period.'
                  : undefined
              }
            />
          )}
          {pageIndex === documentPages.length - 1 && optionalSections?.financialSummary !== false && (
            <PdfClosingSummary statement={statement} locale={resolvedLocale} />
          )}
        </Document.Page>
      ))}
      <PageFooter
        style={{
          border: { top: { width: 1, style: 'solid', color: token('colors.line') } },
          padding: { top: 10 },
        }}
      >
        <StatementFooter brandName={resolvedBrandName} showPageNumber={true} />
      </PageFooter>
    </Document>
  )
}

function PdfClosingSummary({ statement, locale }: { statement: Statement; locale: FinSyncLocale }) {
  return (
    <Column style={{ gap: 6, padding: { top: 6 } }}>
      <ReconciliationBanner statement={statement} locale={locale} variant="compact" />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', padding: { top: 4 } }}>
        <Text style={{ fontSize: 8, color: token('colors.muted') }}>
          Status: Verified & Reconciled (Opening balance + credits − debits = closing balance)
        </Text>
        <Text style={{ fontSize: 9, fontWeight: 700, color: token('colors.primary') }}>
          Closing Balance: {formatExportCurrency(statement.closingBalancePaise, locale)}
        </Text>
      </Row>
    </Column>
  )
}
