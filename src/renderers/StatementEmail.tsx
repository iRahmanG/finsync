import { calculateTotals, formatCurrency, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import { Button, Column, Divider, Email, Heading, Row, Text } from '@hyper-elements/react'
import { finsyncHyperTheme, token } from '../theme'

interface StatementEmailProps {
  statement: Statement
  statementUrl?: string
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
        <Column style={{ gap: 5, padding: 16, backgroundColor: token('colors.surfaceSubtle'), border: `1px solid ${token('colors.line')}`, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>ACCOUNT</Text>
          <Text style={{ fontFamily: 'DM Mono, monospace', fontSize: 17 }}>{maskedAccount}</Text>
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>{statementPeriod}</Text>
        </Column>
        <Row style={{ gap: 12 }}>
          <Column style={{ gap: 6, padding: 16, border: `1px solid ${token('colors.line')}`, borderRadius: 8 }}>
            <Text style={{ fontSize: 10, color: token('colors.muted') }}>Opening balance</Text>
            <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.openingBalancePaise)}</Text>
          </Column>
          <Column style={{ gap: 6, padding: 16, border: `1px solid ${token('colors.line')}`, borderRadius: 8 }}>
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
          <Text style={{ padding: 12, border: `1px solid ${token('colors.line')}`, borderRadius: 7, backgroundColor: token('colors.surfaceSubtle'), color: token('colors.muted'), fontSize: 11, textAlign: 'center' }}>
            No transactions were recorded for this statement period.
          </Text>
        )}
        {!reconciliation.valid && (
          <Text style={{ padding: 12, border: `1px solid ${token('colors.warning')}`, borderRadius: 7, color: token('colors.warning'), backgroundColor: token('colors.warningSoft'), fontSize: 11, lineHeight: 1.5 }}>
            Statement needs review: the calculated closing balance is {formatCurrency(reconciliation.expectedClosingBalancePaise)}, {mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
          </Text>
        )}
        <Divider style={{ borderTop: `1px solid ${token('colors.line')}` }} />
        <Button href={statementUrl} style={{ backgroundColor: token('colors.primary'), borderRadius: 6, padding: [12, 16] }}>View full statement</Button>
        <Text style={{ color: token('colors.muted'), fontSize: 11, lineHeight: 1.5, textAlign: 'center' }}>
          This notification contains a summary only. Sign in to FinSync to view all transactions securely.
        </Text>
      </Email>
    </article>
  )
}
