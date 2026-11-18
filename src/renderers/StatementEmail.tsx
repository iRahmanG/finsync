import { calculateTotals, formatCurrency } from '../financial'
import type { Statement } from '../types'

interface StatementEmailProps {
  statement: Statement
  statementUrl?: string
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export function StatementEmail({ statement, statementUrl = '#statement' }: StatementEmailProps) {
  const totals = calculateTotals(statement.transactions)
  const maskedAccount = statement.accountNumber.replace(/\d(?=\d{4})/g, '•')

  return (
    <article className="email-renderer">
      <div className="email-brand"><span className="brand-mark">F</span><strong>finsync</strong></div>
      <p className="eyebrow">MONTHLY STATEMENT</p>
      <h1>Your June statement is ready</h1>
      <p className="email-copy">
        Hi {statement.accountHolder.split(' ')[0]}, your {statement.accountType.toLowerCase()} statement
        is ready to review.
      </p>
      <section className="email-account">
        <span>ACCOUNT</span>
        <strong>{maskedAccount}</strong>
        <small>{formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}</small>
      </section>
      <section className="email-balances" aria-label="Statement balances">
        <div><span>Opening balance</span><strong>{formatCurrency(statement.openingBalancePaise)}</strong></div>
        <div><span>Closing balance</span><strong>{formatCurrency(statement.closingBalancePaise)}</strong></div>
      </section>
      <section className="email-summary" aria-label="Credits and debits summary">
        <div className="email-summary-credit"><span>Total credits</span><strong>{formatCurrency(totals.totalCreditsPaise)}</strong></div>
        <div className="email-summary-debit"><span>Total debits</span><strong>{formatCurrency(totals.totalDebitsPaise)}</strong></div>
      </section>
      <a className="email-cta" href={statementUrl}>View full statement <span aria-hidden="true">→</span></a>
      <p className="email-footnote">This notification contains a summary only. Sign in to FinSync to view all transactions securely.</p>
    </article>
  )
}
