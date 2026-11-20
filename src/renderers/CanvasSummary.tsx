import { calculateTotals, categoryFor, formatCurrency, formatExportCurrency, formatStatementPeriod, getReconciliation } from '../financial'
import type { Statement } from '../types'
import { Canvas, Column, Divider, Heading, Row, Text } from '@hyper-elements/react'
import { finsyncHyperTheme, token } from '../theme'
import { exportPng } from '../export'
import { useState } from 'react'
import type { FinSyncLocale } from '../public-api'
import * as React from 'react'
void React

interface CanvasSummaryProps {
  statement: Statement
  locale?: FinSyncLocale
  brandName?: string
  logoUrl?: string
  logoAlt?: string
}

export function CanvasSummary({ statement, locale = 'en-IN', brandName = 'FinSync', logoUrl, logoAlt }: CanvasSummaryProps) {
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')

  const handleExport = async () => {
    setExportState('loading')
    setExportMessage('')
    try {
      await exportPng(CanvasDocument({ statement, locale, brandName }), statement)
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
        <CanvasPreview statement={statement} locale={locale} brandName={brandName} logoUrl={logoUrl} logoAlt={logoAlt} />
      </div>
    </div>
  )
}

function CanvasPreview({ statement, brandName = 'FinSync', logoUrl, logoAlt }: CanvasSummaryProps) {
  const totals = calculateTotals(statement.transactions)
  const categoryTotals = new Map<string, number>()
  statement.transactions
    .filter(({ type }) => type === 'DEBIT')
    .forEach((transaction) => {
      const category = categoryFor(transaction.description)
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + transaction.amountPaise)
    })
  const categories = [...categoryTotals.entries()].sort(([, first], [, second]) => second - first)
  const reconciliation = getReconciliation(statement)
  const netCashFlowPaise = totals.totalCreditsPaise - totals.totalDebitsPaise

  return (
    <div className="canvas-preview-card">
      <div className="canvas-artboard-header">
        <div className="brand">{logoUrl ? <img className="brand-logo" src={logoUrl} alt={logoAlt || brandName} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span className="brand-mark">{brandName[0]?.toUpperCase()}</span>}<span>{brandName}</span></div>
        <span>{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end)}</span>
      </div>
      <div className="canvas-metrics">
        <div className="canvas-metric income"><span>Income</span><strong>{formatExportCurrency(totals.totalCreditsPaise)}</strong></div>
        <div className="canvas-metric expense"><span>Expenses</span><strong>{formatExportCurrency(totals.totalDebitsPaise)}</strong></div>
        <div className="canvas-metric balance"><span>Net cash flow</span><strong>{formatExportCurrency(netCashFlowPaise)}</strong></div>
      </div>
      <div className="canvas-chart">
        <div className="category-list">
          <h2>Estimated spending breakdown</h2>
          {categories.length === 0 ? (
            <p className="muted">No debit transactions in this period.</p>
          ) : categories.map(([category, amount], index) => (
            <div className="category-row" key={category}>
              <div><span className={`category-dot category-${index}`} /><strong>{category}</strong><span>{Math.round((amount / totals.totalDebitsPaise) * 100)}%</span></div>
              <div className="category-bar"><i style={{ width: `${Math.round((amount / totals.totalDebitsPaise) * 100)}%` }} /></div>
              <small>{formatCurrency(amount)}</small>
            </div>
          ))}
        </div>
      </div>
      {!reconciliation.valid && (
        <div className="canvas-insight"><span aria-hidden="true">!</span><p><strong>Statement needs review.</strong> Closing balance differs from the calculated balance.</p></div>
      )}
    </div>
  )
}

export function CanvasDocument({ statement, locale = 'en-IN', brandName = 'FinSync' }: CanvasSummaryProps) {
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
    locale,
  )

  return (
    <Canvas
          theme={finsyncHyperTheme}
          fonts={[{ family: 'FinSync Sans', src: '/fonts/FinSync-Regular.ttf', format: 'truetype', weight: 400 }]}
          width={1200}
          height={630}
          title="FinSync financial summary"
          style={{ padding: 44, gap: 24, backgroundColor: '#F0F7F3', color: token('colors.ink'), fontFamily: 'FinSync Sans, Arial, sans-serif' }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>{brandName}</Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted') }}>{statementPeriod}</Text>
          </Row>
          <Row style={{ gap: 14 }}>
            <Metric label="Income" value={formatExportCurrency(totals.totalCreditsPaise)} />
            <Metric label="Expenses" value={formatExportCurrency(totals.totalDebitsPaise)} />
            <Metric label="Net cash flow" value={formatExportCurrency(savingsPaise)} />
          </Row>
          <Divider style={{ borderTop: { width: 1, style: 'solid', color: '#E4E9E6' } }} />
          <Row style={{ gap: 24 }}>
            <Column style={{ flex: 1, gap: 12, padding: 18, backgroundColor: token('colors.surface'), borderRadius: 9 }}>
              <Heading level={2} style={{ fontSize: 17 }}>Estimated spending breakdown</Heading>
              {categories.length === 0 ? (
                <Text style={{ color: token('colors.muted'), fontSize: 12 }}>No debit transactions in this period.</Text>
              ) : categories.map(([category, amount]) => (
                <CategoryRow key={category} category={category} amountPaise={amount} totalPaise={totals.totalDebitsPaise} />
              ))}
            </Column>
            <Column style={{ flex: 1, gap: 10, padding: 18, backgroundColor: token('colors.primarySoft'), borderRadius: 9 }}>
              <Heading level={2} style={{ fontSize: 17 }}>Monthly summary</Heading>
              <Text style={{ color: token('colors.muted'), fontSize: 12 }}>Net cash flow for the statement period</Text>
              <Text style={{ color: token('colors.primary'), fontSize: 22, fontWeight: 700 }}>{formatExportCurrency(savingsPaise)}</Text>
              {!reconciliation.valid && (
                <Text style={{ padding: 10, border: { width: 1, style: 'solid', color: '#9A6700' }, borderRadius: 7, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 11, lineHeight: 1.4 }}>
                  Statement needs review: {mismatch > 0 ? 'over' : 'under'} by {formatExportCurrency(Math.abs(mismatch))}.
                </Text>
              )}
            </Column>
          </Row>
    </Canvas>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Column style={{ flex: 1, gap: 8, padding: 18, backgroundColor: token('colors.surface'), border: { width: 1, style: 'solid', color: '#E4E9E6' }, borderRadius: 9 }}>
      <Text style={{ fontSize: 11, color: token('colors.muted') }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: 700 }}>{value}</Text>
    </Column>
  )
}

function CategoryRow({ category, amountPaise, totalPaise }: { category: string; amountPaise: number; totalPaise: number }) {
  const percentage = Math.round((amountPaise / totalPaise) * 100)
  return (
    <Column style={{ gap: 5 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: 700 }}>{category}</Text>
        <Text style={{ fontSize: 11, color: token('colors.muted') }}>{percentage}%</Text>
      </Row>
      <Text style={{ fontSize: 10, color: token('colors.muted') }}>{formatExportCurrency(amountPaise)}</Text>
    </Column>
  )
}
