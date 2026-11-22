import { useEffect, useState } from 'react'
import React from 'react'
void React
import { Column, Image, Page, Row, Section, Table, TableCell, TableRow, Text, render } from '@hyper-elements/react'
import type { Statement, Transaction } from '../types'
import type { FinSyncRendererConfig } from '../public-api'
import { createFinSyncTheme, token } from '../theme'
import { formatCurrency, formatDate, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'

interface WebStatementProps {
  statement: Statement
  transactions: Transaction[]
  rendererConfig: FinSyncRendererConfig
}

export function StatementPageDocument({ statement, transactions, rendererConfig }: WebStatementProps) {
  const { brandName, locale, theme, optionalSections } = rendererConfig
  const reconciliation = getReconciliation(statement)
  return (
    <Page theme={createFinSyncTheme(theme)} style={{ color: token('colors.ink'), fontFamily: 'FinSync Sans, Arial, sans-serif', backgroundColor: token('colors.surface') }}>
      <Section style={{ gap: 20, padding: 32 }}>
        <Column style={{ gap: 8 }}>
          <Column style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.primary'), textTransform: 'uppercase', letterSpacing: 1.2 }}>Personal finance</Text>
            <Text style={{ fontSize: 30, fontWeight: 700, color: token('colors.ink') }}>Account statement</Text>
            <Text style={{ color: token('colors.muted'), fontSize: 13 }}>{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end, locale)}</Text>
          </Column>
          <Row style={{ gap: 8, alignItems: 'center' }}>
            {rendererConfig.logoUrl && <Image src={rendererConfig.logoUrl} alt={rendererConfig.logoAlt || `${brandName} logo`} style={{ width: 30, height: 30 }} />}
            <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>{brandName}</Text>
          </Row>
        </Column>
        {!reconciliation.valid && (
          <Text style={{ padding: 12, border: { width: 1, style: 'solid', color: token('colors.warning') }, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 12 }}>
            Statement needs review: calculated closing balance is {formatCurrency(reconciliation.expectedClosingBalancePaise, locale)}.
          </Text>
        )}
        {optionalSections?.accountDetails !== false && (
          <Row style={{ gap: 16, padding: 18, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: theme?.borderRadius ?? 9 }}>
            <Column style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>ACCOUNT</Text>
              <Text style={{ fontSize: 15, fontWeight: 700 }}>{statement.accountType}</Text>
              <Text style={{ color: token('colors.muted'), fontSize: 11 }}>{maskAccountNumber(statement.accountNumber)} · {statement.accountHolder}</Text>
            </Column>
            <Column style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>STATEMENT PERIOD</Text>
              <Text style={{ fontSize: 12 }}>{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end, locale)}</Text>
            </Column>
          </Row>
        )}
        {optionalSections?.financialSummary !== false && (
          <Column style={{ gap: 12 }}>
            <Row style={{ gap: 12 }}>
              <Summary label="Opening balance" value={formatCurrency(statement.openingBalancePaise, locale)} />
              <Summary label="Closing balance" value={formatCurrency(statement.closingBalancePaise, locale)} />
            </Row>
            <Row style={{ gap: 12 }}>
              <Summary label="Credits" value={formatCurrency(statement.transactions.filter(({ type }) => type === 'CREDIT').reduce((total, transaction) => total + transaction.amountPaise, 0), locale)} />
              <Summary label="Debits" value={formatCurrency(statement.transactions.filter(({ type }) => type === 'DEBIT').reduce((total, transaction) => total + transaction.amountPaise, 0), locale)} />
            </Row>
          </Column>
        )}
        {optionalSections?.transactions !== false && (
          <Column style={{ gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>Transactions</Text>
            <Table style={{ width: '100%', border: { width: 1, style: 'solid', color: token('colors.line') }, cellPadding: [10, 7] }}>
              <TableRow header>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Type</TableCell>
                <TableCell style={{ textAlign: 'right' }}>Amount</TableCell>
              </TableRow>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date, locale)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.reference}</TableCell>
                  <TableCell style={{ color: transaction.type === 'CREDIT' ? token('colors.primary') : token('colors.debit') }}>{transaction.type}</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>{transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amountPaise, locale)}</TableCell>
                </TableRow>
              ))}
            </Table>
            {transactions.length === 0 && <Text style={{ color: token('colors.muted'), fontSize: 12 }}>No transactions match the current filters.</Text>}
          </Column>
        )}
      </Section>
    </Page>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Column style={{ flex: 1, gap: 4, padding: 14, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: 8 }}>
      <Text style={{ color: token('colors.muted'), fontSize: 10 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: 700 }}>{value}</Text>
    </Column>
  )
}

export function StatementPagePreview(props: WebStatementProps) {
  const [html, setHtml] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    render(StatementPageDocument(props))
      .then((result) => {
        if (active) {
          setError(undefined)
          setHtml(`<style>${result.bodyStyle}</style>${result.body}`)
        }
      })
      .catch((renderError: unknown) => {
        if (active) setError(renderError instanceof Error ? renderError.message : 'Web statement rendering failed.')
      })
    return () => { active = false }
  }, [props])

  if (error) return <p className="export-message error" role="alert">{error}</p>
  if (!html) return <p className="export-message" role="status">Preparing statement…</p>
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
