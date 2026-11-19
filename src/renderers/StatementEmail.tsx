import { calculateTotals, formatCurrency, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import { Button, Column, Divider, Email, Heading, Row, Text } from '@hyper-elements/react'
import { finsyncHyperTheme, token } from '../theme'

interface StatementEmailProps {
  statement: Statement
  statementUrl?: string
}

const themeLiteralLine = '#E4E9E6'

export function StatementEmailDocument({ statement, statementUrl = '#statement' }: StatementEmailProps) {
  const totals = calculateTotals(statement.transactions)
  const maskedAccount = maskAccountNumber(statement.accountNumber)
  const reconciliation = getReconciliation(statement)
  const mismatch = reconciliation.differencePaise
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
  )

  return (
    <Email
      theme={finsyncHyperTheme}
      width={560}
      previewText="Your FinSync account statement is ready"
      style={{ gap: 16, backgroundColor: token('colors.surface'), color: token('colors.ink'), fontFamily: 'DM Sans, Arial, sans-serif' }}
    >
      <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.primary'), textTransform: 'uppercase', letterSpacing: 1 }}>Monthly statement</Text>
      <Heading level={1} style={{ fontSize: 30, lineHeight: 1.2, color: token('colors.ink') }}>Your account statement is ready</Heading>
      <Text style={{ color: token('colors.muted'), fontSize: 14, lineHeight: 1.6 }}>
        Hi {statement.accountHolder.split(' ')[0]}, your {statement.accountType.toLowerCase()} statement is ready to review.
      </Text>
      <Column style={{ gap: 5, padding: 16, backgroundColor: token('colors.surfaceSubtle'), border: { width: 1, style: 'solid', color: themeLiteralLine }, borderRadius: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>ACCOUNT</Text>
        <Text style={{ fontFamily: 'DM Mono, monospace', fontSize: 17 }}>{maskedAccount}</Text>
        <Text style={{ fontSize: 11, color: token('colors.muted') }}>{statementPeriod}</Text>
      </Column>
      <Row style={{ gap: 12 }}>
        <Column style={{ gap: 6, padding: 16, border: { width: 1, style: 'solid', color: themeLiteralLine }, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: token('colors.muted') }}>Opening balance</Text>
          <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.openingBalancePaise)}</Text>
        </Column>
        <Column style={{ gap: 6, padding: 16, border: { width: 1, style: 'solid', color: themeLiteralLine }, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: token('colors.muted') }}>Closing balance</Text>
          <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.closingBalancePaise)}</Text>
        </Column>
      </Row>
      <Row style={{ gap: 12 }}>
        <Column style={{ gap: 6, padding: 16, backgroundColor: token('colors.primarySoft'), borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: token('colors.primary') }}>Total credits</Text>
          <Text style={{ fontSize: 15, fontWeight: 700, color: token('colors.primary') }}>{formatCurrency(totals.totalCreditsPaise)}</Text>
        </Column>
        <Column style={{ gap: 6, padding: 16, backgroundColor: token('colors.debitSoft'), borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: token('colors.debit') }}>Total debits</Text>
          <Text style={{ fontSize: 15, fontWeight: 700, color: token('colors.debit') }}>{formatCurrency(totals.totalDebitsPaise)}</Text>
        </Column>
      </Row>
      {statement.transactions.length === 0 && (
        <Text style={{ padding: 12, border: { width: 1, style: 'solid', color: themeLiteralLine }, borderRadius: 7, backgroundColor: token('colors.surfaceSubtle'), color: token('colors.muted'), fontSize: 11, textAlign: 'center' }}>
          No transactions were recorded for this statement period.
        </Text>
      )}
      {!reconciliation.valid && (
        <Text style={{ padding: 12, border: { width: 1, style: 'solid', color: '#9A6700' }, borderRadius: 7, color: token('colors.warning'), backgroundColor: token('colors.warningSoft'), fontSize: 11, lineHeight: 1.5 }}>
          Statement needs review: the calculated closing balance is {formatCurrency(reconciliation.expectedClosingBalancePaise)}, {mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
        </Text>
      )}
      <Divider style={{ borderTop: { width: 1, style: 'solid', color: themeLiteralLine } }} />
      <Button href={statementUrl} style={{ backgroundColor: token('colors.primary'), borderRadius: 6, padding: [12, 16] }}>View full statement</Button>
    </Email>
  )
}

export function StatementEmail({ statement, statementUrl = '#statement' }: StatementEmailProps) {
  const totals = calculateTotals(statement.transactions)
  const maskedAccount = maskAccountNumber(statement.accountNumber)
  const reconciliation = getReconciliation(statement)
  const mismatch = reconciliation.differencePaise
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
  )

  return (
    <article className="email-renderer">
      <div className="email-brand"><span className="brand-mark">F</span><strong>finsync</strong></div>
      <p className="eyebrow">MONTHLY STATEMENT</p>
      <h1>Your account statement is ready</h1>
      <p className="email-copy">Hi {statement.accountHolder.split(' ')[0]}, your {statement.accountType.toLowerCase()} statement is ready to review.</p>
      <section className="email-account">
        <span>ACCOUNT</span>
        <strong>{maskedAccount}</strong>
        <small>{statementPeriod}</small>
      </section>
      <section className="email-balances">
        <div><span>Opening balance</span><strong>{formatCurrency(statement.openingBalancePaise)}</strong></div>
        <div><span>Closing balance</span><strong>{formatCurrency(statement.closingBalancePaise)}</strong></div>
      </section>
      <section className="email-summary">
        <div className="email-summary-credit"><span>Total credits</span><strong>{formatCurrency(totals.totalCreditsPaise)}</strong></div>
        <div className="email-summary-debit"><span>Total debits</span><strong>{formatCurrency(totals.totalDebitsPaise)}</strong></div>
      </section>
      {statement.transactions.length === 0 && <p className="email-reconciliation">No transactions were recorded for this statement period.</p>}
      {!reconciliation.valid && (
        <p className="email-reconciliation">
          Statement needs review: the calculated closing balance is {formatCurrency(reconciliation.expectedClosingBalancePaise)}, {mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
        </p>
      )}
      <a className="email-cta" href={statementUrl}>View full statement <span aria-hidden="true">→</span></a>
      <p className="email-footnote">This notification contains a summary only. Sign in to FinSync to view all transactions securely.</p>
    </article>
  )
}
