import { calculateTotals, formatCurrency, formatStatementPeriod, getReconciliation } from '../financial'
import type { Statement } from '../types'
import { Canvas, Column, Divider, Heading, Row, Text } from '@hyper-elements/react'
import { finsyncHyperTheme, token } from '../theme'

interface CanvasSummaryProps {
  statement: Statement
}

const categoryFor = (description: string) => {
  const value = description.toLowerCase()
  if (value.includes('rent')) return 'Housing'
  if (value.includes('grocery')) return 'Groceries'
  if (value.includes('electricity')) return 'Utilities'
  if (value.includes('restaurant')) return 'Dining'
  return 'Other'
}

export function CanvasSummary({ statement }: CanvasSummaryProps) {
  return (
    <div className="canvas-renderer">
      <div className="canvas-heading">
        <div><p className="eyebrow">FINANCIAL SNAPSHOT</p><h1>Statement at a glance</h1><p className="muted">{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end)}</p></div>
        <button className="download-button" type="button" onClick={() => window.print()}>↓ Save summary</button>
      </div>
      <div className="canvas-artboard">
        <CanvasPreview statement={statement} />
      </div>
    </div>
  )
}

function CanvasPreview({ statement }: CanvasSummaryProps) {
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
        <div className="brand"><span className="brand-mark">F</span><span>finsync</span></div>
        <span>{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end)}</span>
      </div>
      <div className="canvas-metrics">
        <div className="canvas-metric income"><span>Income</span><strong>{formatCurrency(totals.totalCreditsPaise)}</strong></div>
        <div className="canvas-metric expense"><span>Expenses</span><strong>{formatCurrency(totals.totalDebitsPaise)}</strong></div>
        <div className="canvas-metric balance"><span>Net cash flow</span><strong>{formatCurrency(netCashFlowPaise)}</strong></div>
      </div>
      <div className="canvas-chart">
        <div className="category-list">
          <h2>Spending breakdown</h2>
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

export function CanvasDocument({ statement }: CanvasSummaryProps) {
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
  )

  return (
    <Canvas
          theme={finsyncHyperTheme}
          width={1200}
          height={630}
          title="FinSync financial summary"
          style={{ padding: 44, gap: 24, backgroundColor: '#F0F7F3', color: token('colors.ink'), fontFamily: 'DM Sans, Arial, sans-serif' }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>finsync</Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted') }}>{statementPeriod}</Text>
          </Row>
          <Row style={{ gap: 14 }}>
            <Metric label="Income" value={formatCurrency(totals.totalCreditsPaise)} />
            <Metric label="Expenses" value={formatCurrency(totals.totalDebitsPaise)} />
            <Metric label="Net cash flow" value={formatCurrency(savingsPaise)} />
          </Row>
          <Divider style={{ borderTop: { width: 1, style: 'solid', color: '#E4E9E6' } }} />
          <Row style={{ gap: 24 }}>
            <Column style={{ flex: 1, gap: 12, padding: 18, backgroundColor: token('colors.surface'), borderRadius: 9 }}>
              <Heading level={2} style={{ fontSize: 17 }}>Spending breakdown</Heading>
              {categories.length === 0 ? (
                <Text style={{ color: token('colors.muted'), fontSize: 12 }}>No debit transactions in this period.</Text>
              ) : categories.map(([category, amount]) => (
                <CategoryRow key={category} category={category} amountPaise={amount} totalPaise={totals.totalDebitsPaise} />
              ))}
            </Column>
            <Column style={{ flex: 1, gap: 10, padding: 18, backgroundColor: token('colors.primarySoft'), borderRadius: 9 }}>
              <Heading level={2} style={{ fontSize: 17 }}>Monthly summary</Heading>
              <Text style={{ color: token('colors.muted'), fontSize: 12 }}>Net cash flow for the statement period</Text>
              <Text style={{ color: token('colors.primary'), fontSize: 22, fontWeight: 700 }}>{formatCurrency(savingsPaise)}</Text>
              {!reconciliation.valid && (
                <Text style={{ padding: 10, border: { width: 1, style: 'solid', color: '#9A6700' }, borderRadius: 7, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 11, lineHeight: 1.4 }}>
                  Statement needs review: {mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
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
      <Text style={{ fontSize: 10, color: token('colors.muted') }}>{formatCurrency(amountPaise)}</Text>
    </Column>
  )
}
