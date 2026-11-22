import { calculateTotals, formatCurrency, formatDate, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import { Button, Column, Divider, Email, Heading, Image, Row, Table, TableCell, TableRow, Text, render } from '@hyper-elements/react'
import { createFinSyncTheme, token } from '../theme'
import type { FinSyncRendererConfig } from '../public-api'
import { useEffect, useState } from 'react'
import React from 'react'
void React

interface StatementEmailProps {
  statement: Statement
  statementUrl?: string
  rendererConfig?: FinSyncRendererConfig
}

const defaultRendererConfig: FinSyncRendererConfig = { brandName: 'FinSync', locale: 'en-IN' }

export function StatementEmailDocument({
  statement,
  statementUrl = '#statement',
  rendererConfig = defaultRendererConfig,
}: StatementEmailProps) {
  const { brandName, locale, theme, optionalSections } = rendererConfig
  const hyperTheme = createFinSyncTheme(theme)
  const totals = calculateTotals(statement.transactions)
  const maskedAccount = maskAccountNumber(statement.accountNumber)
  const reconciliation = getReconciliation(statement)
  const mismatch = reconciliation.differencePaise
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
    locale,
  )

  return (
    <Email
      theme={hyperTheme}
      fonts={[{ family: 'FinSync Sans', src: '/fonts/FinSync-Regular.ttf', format: 'truetype', weight: 400 }]}
      width={560}
      previewText={`Your ${brandName} account statement is ready`}
      style={{ gap: 16, backgroundColor: token('colors.surface'), color: token('colors.ink'), fontFamily: 'FinSync Sans, Arial, sans-serif' }}
    >
      <Row style={{ gap: 8, alignItems: 'center' }}>
        {rendererConfig.logoUrl && <Image src={rendererConfig.logoUrl} alt={rendererConfig.logoAlt || `${brandName} logo`} style={{ width: 28, height: 28 }} />}
        <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>{brandName}</Text>
      </Row>
      <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.primary'), textTransform: 'uppercase', letterSpacing: 1 }}>Monthly statement</Text>
      <Heading level={1} style={{ fontSize: 30, lineHeight: 1.2, color: token('colors.ink') }}>Your account statement is ready</Heading>
      <Text style={{ color: token('colors.muted'), fontSize: 14, lineHeight: 1.6 }}>
        Hi {statement.accountHolder.split(' ')[0]}, your {statement.accountType.toLowerCase()} statement is ready to review.
      </Text>
      {optionalSections?.accountDetails !== false && (
        <Column style={{ gap: 5, padding: 16, backgroundColor: token('colors.surfaceSubtle'), border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md') }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>ACCOUNT</Text>
          <Text style={{ fontFamily: 'DM Mono, monospace', fontSize: 17 }}>{maskedAccount}</Text>
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>{statement.accountHolder} · {statementPeriod}</Text>
        </Column>
      )}
      {optionalSections?.financialSummary !== false && (
        <>
          <Row style={{ gap: 12 }}>
            <Column style={{ gap: 6, padding: 16, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md') }}>
              <Text style={{ fontSize: 10, color: token('colors.muted') }}>Opening balance</Text>
              <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.openingBalancePaise, locale)}</Text>
            </Column>
            <Column style={{ gap: 6, padding: 16, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md') }}>
              <Text style={{ fontSize: 10, color: token('colors.muted') }}>Closing balance</Text>
              <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.closingBalancePaise, locale)}</Text>
            </Column>
          </Row>
          <Row style={{ gap: 12 }}>
            <Column style={{ gap: 6, padding: 16, backgroundColor: token('colors.primarySoft'), borderRadius: token('radii.md') }}>
              <Text style={{ fontSize: 10, color: token('colors.primary') }}>Total credits</Text>
              <Text style={{ fontSize: 15, fontWeight: 700, color: token('colors.primary') }}>{formatCurrency(totals.totalCreditsPaise, locale)}</Text>
            </Column>
            <Column style={{ gap: 6, padding: 16, backgroundColor: token('colors.debitSoft'), borderRadius: token('radii.md') }}>
              <Text style={{ fontSize: 10, color: token('colors.debit') }}>Total debits</Text>
              <Text style={{ fontSize: 15, fontWeight: 700, color: token('colors.debit') }}>{formatCurrency(totals.totalDebitsPaise, locale)}</Text>
            </Column>
          </Row>
        </>
      )}
      {optionalSections?.transactions !== false && statement.transactions.length === 0 && (
        <Text style={{ padding: 12, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.sm'), backgroundColor: token('colors.surfaceSubtle'), color: token('colors.muted'), fontSize: 11, textAlign: 'center' }}>
          No transactions were recorded for this statement period.
        </Text>
      )}
      {optionalSections?.transactions !== false && statement.transactions.length > 0 && (
        <Table style={{ width: '100%', border: { width: 1, style: 'solid', color: token('colors.line') }, cellPadding: [8, 5], fontSize: 11 }}>
          <TableRow header><TableCell>Date</TableCell><TableCell>Description</TableCell><TableCell style={{ textAlign: 'right' }}>Amount</TableCell></TableRow>
          {statement.transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.date, locale)}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell style={{ textAlign: 'right' }}>{transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amountPaise, locale)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}
      {!reconciliation.valid && (
        <Text style={{ padding: 12, border: { width: 1, style: 'solid', color: token('colors.warning') }, borderRadius: token('radii.sm'), color: token('colors.warning'), backgroundColor: token('colors.warningSoft'), fontSize: 11, lineHeight: 1.5 }}>
          Statement needs review: the calculated closing balance is {formatCurrency(reconciliation.expectedClosingBalancePaise, locale)}, {mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch), locale)}.
        </Text>
      )}
      <Divider style={{ borderTop: { width: 1, style: 'solid', color: token('colors.line') } }} />
      <Button href={statementUrl} style={{ backgroundColor: token('colors.primary'), borderRadius: token('radii.sm'), padding: [12, 16] }}>View full statement</Button>
    </Email>
  )
}

export function StatementEmail({ statement, statementUrl = '#statement', rendererConfig }: StatementEmailProps) {
  const [html, setHtml] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    render(StatementEmailDocument({ statement, statementUrl, rendererConfig }))
      .then((result) => {
        if (active) {
          setError(undefined)
          setHtml(result.html)
        }
      })
      .catch((renderError: unknown) => {
        if (active) setError(renderError instanceof Error ? renderError.message : 'Email rendering failed.')
      })
    return () => { active = false }
  }, [rendererConfig, statement, statementUrl])

  if (error) return <p className="export-message error" role="alert">{error}</p>
  if (!html) return <p className="export-message" role="status">Preparing email preview…</p>
  return <iframe className="email-renderer-frame" title="Generated email preview" srcDoc={html} />
}
