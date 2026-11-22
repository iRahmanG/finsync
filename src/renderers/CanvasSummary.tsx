import { calculateTotals, categoryFor, formatExportCurrency, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import { Canvas, Column, Divider, Heading, Image, Row, Text } from '@hyper-elements/react'
import { createFinSyncTheme, token } from '../theme'
import { exportPng } from '../export'
import { useState } from 'react'
import type { FinSyncLocale, FinSyncRendererConfig } from '../public-api'
import * as React from 'react'
void React
import { HyperPreview } from './HyperPreview'

interface CanvasSummaryProps {
  statement: Statement
  locale?: FinSyncLocale
  brandName?: string
  logoUrl?: string
  logoAlt?: string
  rendererConfig?: FinSyncRendererConfig
}

export function CanvasSummary({ statement, locale = 'en-IN', brandName = 'FinSync', logoUrl, logoAlt, rendererConfig }: CanvasSummaryProps) {
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')

  const handleExport = async () => {
    setExportState('loading')
    setExportMessage('')
    try {
      await exportPng(CanvasDocument({ statement, rendererConfig: rendererConfig ?? { brandName, locale } }), statement, rendererConfig)
      setExportState('success')
      setExportMessage('PNG download started.')
    } catch (error) {
      setExportState('error')
      setExportMessage(error instanceof Error ? error.message : 'PNG export failed.')
    }
  }

  return (
    <div className="canvas-renderer">
      <div className="canvas-heading">
        <div><p className="eyebrow">FINANCIAL SNAPSHOT</p><h1>Statement at a glance</h1><p className="muted">{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end, locale)}</p></div>
        <button className="download-button" type="button" onClick={handleExport} disabled={exportState === 'loading'}>
          {exportState === 'loading' ? 'Preparing PNG…' : '↓ Download PNG'}
        </button>
      </div>
      {exportMessage && <p className={exportState === 'error' ? 'export-message error' : 'export-message'} role={exportState === 'error' ? 'alert' : 'status'}>{exportMessage}</p>}
      <div className="canvas-artboard">
        <HyperPreview
          title="Generated canvas preview"
          element={CanvasDocument({ statement, rendererConfig: rendererConfig ?? { brandName, locale, logoUrl, logoAlt } })}
        />
      </div>
    </div>
  )
}

export function CanvasDocument({ statement, locale = 'en-IN', brandName = 'FinSync', rendererConfig }: CanvasSummaryProps) {
  const resolvedConfig = rendererConfig ?? { brandName, locale }
  const resolvedLocale = resolvedConfig.locale
  const resolvedBrandName = resolvedConfig.brandName
  const optionalSections = resolvedConfig.optionalSections
  const totals = calculateTotals(statement.transactions)
  const categoryTotals = new Map<string, number>()
  statement.transactions
    .filter(({ type }) => type === 'DEBIT')
    .forEach((transaction) => {
      const category = categoryFor(transaction.description)
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + transaction.amountPaise)
    })
  const categories = [...categoryTotals.entries()].sort(([, first], [, second]) => second - first)
  const savingsPaise = totals.totalCreditsPaise - totals.totalDebitsPaise
  const reconciliation = getReconciliation(statement)
  const mismatch = reconciliation.differencePaise
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
    resolvedLocale,
  )

  return (
    <Canvas
          theme={createFinSyncTheme(resolvedConfig.theme)}
          fonts={[{ family: 'Noto Sans', src: '/fonts/NotoSans-Regular.ttf', format: 'truetype', weight: 400 }]}
          width={1200}
          height={630}
          title={`${resolvedBrandName} financial summary`}
          style={{ padding: token('spacing.xl'), gap: token('spacing.lg'), backgroundColor: token('colors.surfaceSubtle'), color: token('colors.ink'), fontFamily: 'Noto Sans, Arial, sans-serif' }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row style={{ gap: 8, alignItems: 'center' }}>
              {resolvedConfig.logoUrl && <Image src={resolvedConfig.logoUrl} alt={resolvedConfig.logoAlt || `${resolvedBrandName} logo`} style={{ width: 28, height: 28 }} />}
              <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>{resolvedBrandName}</Text>
            </Row>
            {optionalSections?.accountDetails !== false
              ? <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted') }}>{maskAccountNumber(statement.accountNumber)} · {statementPeriod}</Text>
              : <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted') }}>{statementPeriod}</Text>}
          </Row>
          {optionalSections?.financialSummary !== false && <Row style={{ gap: token('spacing.sm') }}>
            <Metric label="Income" value={formatExportCurrency(totals.totalCreditsPaise, resolvedLocale)} />
            <Metric label="Expenses" value={formatExportCurrency(totals.totalDebitsPaise, resolvedLocale)} />
            <Metric label="Net cash flow" value={formatExportCurrency(savingsPaise, resolvedLocale)} />
          </Row>}
          {optionalSections?.transactions !== false && <Divider style={{ borderTop: { width: 1, style: 'solid', color: token('colors.line') } }} />}
          {optionalSections?.transactions !== false && <Row style={{ gap: token('spacing.lg') }}>
            <Column style={{ flex: 1, gap: token('spacing.sm'), padding: token('spacing.md'), backgroundColor: token('colors.surface'), borderRadius: token('radii.md') }}>
              <Heading level={2} style={{ fontSize: 17 }}>Estimated spending breakdown</Heading>
              {categories.length === 0 ? (
                <Text style={{ color: token('colors.muted'), fontSize: 12 }}>No debit transactions in this period.</Text>
              ) : categories.map(([category, amount]) => (
                <CategoryRow key={category} category={category} amountPaise={amount} totalPaise={totals.totalDebitsPaise} locale={resolvedLocale} />
              ))}
            </Column>
            <Column style={{ flex: 1, gap: token('spacing.sm'), padding: token('spacing.md'), backgroundColor: token('colors.primarySoft'), borderRadius: token('radii.md') }}>
              <Heading level={2} style={{ fontSize: 17 }}>Monthly summary</Heading>
              <Text style={{ color: token('colors.muted'), fontSize: 12 }}>Net cash flow for the statement period</Text>
              <Text style={{ color: token('colors.primary'), fontSize: 22, fontWeight: 700 }}>{formatExportCurrency(savingsPaise, resolvedLocale)}</Text>
              {!reconciliation.valid && (
                <Text style={{ padding: 10, border: { width: 1, style: 'solid', color: token('colors.warning') }, borderRadius: token('radii.sm'), backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 11, lineHeight: 1.4 }}>
                  Statement needs review: {mismatch > 0 ? 'over' : 'under'} by {formatExportCurrency(Math.abs(mismatch), resolvedLocale)}.
                </Text>
              )}
            </Column>
          </Row>}
    </Canvas>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Column style={{ flex: 1, gap: token('spacing.sm'), padding: token('spacing.md'), backgroundColor: token('colors.surface'), border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md') }}>
      <Text style={{ fontSize: 11, color: token('colors.muted') }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: 700 }}>{value}</Text>
    </Column>
  )
}

function CategoryRow({ category, amountPaise, totalPaise, locale }: { category: string; amountPaise: number; totalPaise: number; locale: FinSyncLocale }) {
  const percentage = Math.round((amountPaise / totalPaise) * 100)
  return (
    <Column style={{ gap: 5 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: 700 }}>{category}</Text>
        <Text style={{ fontSize: 11, color: token('colors.muted') }}>{percentage}%</Text>
      </Row>
      <Text style={{ fontSize: 10, color: token('colors.muted') }}>{formatExportCurrency(amountPaise, locale)}</Text>
    </Column>
  )
}
