import { calculateTotals, formatCurrency } from '../financial'
import type { Transaction } from '../types'
import type { FinSyncLocale } from '../public-api'

interface MonthlyFinancialSummaryProps {
  transactions: Transaction[]
  openingBalancePaise: number
  closingBalancePaise: number
  locale?: FinSyncLocale
}

export function MonthlyFinancialSummary({
  transactions,
  openingBalancePaise,
  closingBalancePaise,
  locale = 'en-IN',
}: MonthlyFinancialSummaryProps) {
  const totals = calculateTotals(transactions)
  const creditCount = transactions.filter(({ type }) => type === 'CREDIT').length
  const debitCount = transactions.filter(({ type }) => type === 'DEBIT').length
  const netCashFlowPaise = totals.totalCreditsPaise - totals.totalDebitsPaise

  return (
    <section className="summary-grid" aria-label="Monthly financial summary">
      <SummaryCard kind="balance" label="Opening balance" amountPaise={openingBalancePaise} detail="Start of period" locale={locale} />
      <SummaryCard kind="credit" label="Closing balance" amountPaise={closingBalancePaise} detail="End of period" locale={locale} />
      <SummaryCard kind="credit" label="Total credits" amountPaise={totals.totalCreditsPaise} detail={`${creditCount} transactions`} locale={locale} />
      <SummaryCard kind="debit" label="Total debits" amountPaise={totals.totalDebitsPaise} detail={`${debitCount} transactions`} locale={locale} />
      <p className="net-cash-flow"><span>Net cash flow</span><strong>{formatCurrency(netCashFlowPaise, locale)}</strong></p>
    </section>
  )
}

function SummaryCard({
  kind,
  label,
  amountPaise,
  detail,
  locale,
}: {
  kind: 'credit' | 'debit' | 'balance'
  label: string
  amountPaise: number
  detail: string
  locale: FinSyncLocale
}) {
  const icon = kind === 'credit' ? '↗' : kind === 'debit' ? '↘' : '◈'
  return (
    <article className="summary-card">
      <div className={`summary-icon ${kind}`} aria-hidden="true">{icon}</div>
      <div>
        <p className="card-label">{label}</p>
        <strong>{formatCurrency(amountPaise, locale)}</strong>
        <span>{detail}</span>
      </div>
    </article>
  )
}
