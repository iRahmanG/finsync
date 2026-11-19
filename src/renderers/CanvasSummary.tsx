import { useMemo } from 'react'
import { calculateTotals, formatCurrency, validateStatement } from '../financial'
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
  const totals = calculateTotals(statement.transactions)
  const categories = useMemo(() => {
    const categoryTotals = new Map<string, number>()
    statement.transactions
      .filter(({ type }) => type === 'DEBIT')
      .forEach((transaction) => {
        const category = categoryFor(transaction.description)
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + transaction.amountPaise)
      })
    return [...categoryTotals.entries()].sort(([, first], [, second]) => second - first)
  }, [statement.transactions])
  const savingsPaise = totals.totalCreditsPaise - totals.totalDebitsPaise
  const validation = validateStatement(statement)
  const expectedClosingBalance =
    statement.openingBalancePaise + totals.totalCreditsPaise - totals.totalDebitsPaise
  const mismatch = statement.closingBalancePaise - expectedClosingBalance

  return (
    <div className="canvas-renderer">
      <div className="canvas-heading">
        <div><p className="eyebrow">FINANCIAL SNAPSHOT</p><h1>June at a glance</h1><p className="muted">A visual summary of your monthly money flow.</p></div>
        <button className="download-button" type="button" onClick={() => window.print()}>↓ Save summary</button>
      </div>
      <div className="canvas-artboard">
        <Canvas
          theme={finsyncHyperTheme}
          width={1200}
          height={630}
          title="FinSync financial summary"
          style={{ padding: 44, gap: 24, backgroundColor: '#F0F7F3', color: token('colors.ink'), fontFamily: 'DM Sans, Arial, sans-serif' }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>finsync</Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted') }}>JUNE 2024</Text>
          </Row>
          <Row style={{ gap: 14 }}>
            <Metric label="Income" value={formatCurrency(totals.totalCreditsPaise)} />
            <Metric label="Expenses" value={formatCurrency(totals.totalDebitsPaise)} />
            <Metric label="Net cash flow" value={formatCurrency(savingsPaise)} />
          </Row>
          <Divider style={{ borderTop: `1px solid ${token('colors.line')}` }} />
          <Row style={{ gap: 24 }}>
            <Column style={{ flex: 1, gap: 12, padding: 18, backgroundColor: token('colors.surface'), borderRadius: 9 }}>
              <Heading level={2} style={{ fontSize: 17 }}>Spending breakdown</Heading>
              {categories.map(([category, amount]) => (
                <CategoryRow key={category} category={category} amountPaise={amount} totalPaise={totals.totalDebitsPaise} />
              ))}
            </Column>
            <Column style={{ flex: 1, gap: 10, padding: 18, backgroundColor: token('colors.primarySoft'), borderRadius: 9 }}>
              <Heading level={2} style={{ fontSize: 17 }}>Monthly summary</Heading>
              <Text style={{ color: token('colors.muted'), fontSize: 12 }}>Net cash flow for June</Text>
              <Text style={{ color: token('colors.primary'), fontSize: 22, fontWeight: 700 }}>{formatCurrency(savingsPaise)}</Text>
              {!validation.valid && (
                <Text style={{ padding: 10, border: `1px solid ${token('colors.warning')}`, borderRadius: 7, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 11, lineHeight: 1.4 }}>
                  Statement needs review: {mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
                </Text>
              )}
            </Column>
          </Row>
        </Canvas>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Column style={{ flex: 1, gap: 8, padding: 18, backgroundColor: token('colors.surface'), border: `1px solid ${token('colors.line')}`, borderRadius: 9 }}>
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
