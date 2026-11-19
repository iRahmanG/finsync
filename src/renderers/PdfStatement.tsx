import { calculateRunningBalances, calculateTotals, formatCurrency, maskAccountNumber, validateStatement } from '../financial'
import type { Statement } from '../types'
import {
  Column,
  Document,
  PageFooter,
  PageHeader,
  PageNumber,
  Row,
  Table,
  TableCell,
  TableRow,
  Text,
} from '@hyper-elements/react'
import { finsyncHyperTheme, token } from '../theme'

interface PdfStatementProps {
  statement: Statement
  onClose?: () => void
}

const ROWS_PER_PAGE = 5

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export function PdfStatement({ statement, onClose }: PdfStatementProps) {
  const balances = calculateRunningBalances(statement)
  const chronologicalTransactions = [...statement.transactions].sort((first, second) =>
    first.date.localeCompare(second.date),
  )
  const pages = Array.from(
    { length: Math.ceil(chronologicalTransactions.length / ROWS_PER_PAGE) },
    (_, pageIndex) => chronologicalTransactions.slice(pageIndex * ROWS_PER_PAGE, (pageIndex + 1) * ROWS_PER_PAGE),
  )

  return (
    <div className="pdf-preview">
      <div className="pdf-toolbar no-print">
        <div><p className="eyebrow">PDF STATEMENT</p><h1>Print-ready A4 statement</h1></div>
        <div className="pdf-actions">
          {onClose && <button className="secondary-button" type="button" onClick={onClose}>Back to web</button>}
          <button className="download-button" type="button" onClick={() => window.print()}>↓ Save as PDF</button>
        </div>
      </div>
      <div className="pdf-document">
        <Document
          theme={finsyncHyperTheme}
          size="A4"
          margin={{ top: 48, right: 48, bottom: 48, left: 48 }}
          title="FinSync account statement"
          style={{ gap: 24, color: token('colors.ink'), fontFamily: 'DM Sans, Arial, sans-serif', backgroundColor: token('colors.surface') }}
        >
          <PageHeader style={{ padding: { bottom: 16 }, border: { bottom: `1px solid ${token('colors.line')}` } }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>finsync</Text>
              <Text style={{ fontSize: 10, color: token('colors.muted') }}>
                {formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}
              </Text>
            </Row>
          </PageHeader>
          {pages.map((page, pageIndex) => (
            <Document.Page key={pageIndex} style={{ gap: 18 }}>
              {pageIndex === 0 && (
                <Row style={{ gap: 16, padding: { top: 12, bottom: 12 } }}>
                  <Column style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 9, color: token('colors.muted') }}>ACCOUNT HOLDER</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700 }}>{statement.accountHolder}</Text>
                  </Column>
                  <Column style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 9, color: token('colors.muted') }}>ACCOUNT</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700 }}>{maskAccountNumber(statement.accountNumber)}</Text>
                  </Column>
                  <Column style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 9, color: token('colors.muted') }}>TYPE</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700 }}>{statement.accountType}</Text>
                  </Column>
                </Row>
              )}
              <Table style={{ width: '100%', fontSize: 9, border: `1px solid ${token('colors.line')}`, cellPadding: [10, 6] }}>
                <TableRow header>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Amount</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Running balance</TableCell>
                </TableRow>
                {page.map((transaction) => {
                  const runningBalance = balances.find(({ transactionId }) => transactionId === transaction.id)
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell style={{ color: transaction.type === 'CREDIT' ? token('colors.primary') : token('colors.debit') }}>{transaction.type}</TableCell>
                      <TableCell style={{ textAlign: 'right', color: transaction.type === 'CREDIT' ? token('colors.primary') : token('colors.debit') }}>
                        {transaction.type === 'CREDIT' ? '+' : '−'} {formatCurrency(transaction.amountPaise)}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>{formatCurrency(runningBalance?.balancePaise ?? statement.openingBalancePaise)}</TableCell>
                    </TableRow>
                  )
                })}
              </Table>
              {pageIndex === pages.length - 1 && <PdfClosingSummary statement={statement} />}
            </Document.Page>
          ))}
          <PageFooter style={{ border: { top: `1px solid ${token('colors.line')}` }, padding: { top: 10 } }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>FinSync • Confidential</Text>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>Synthetic demonstration</Text>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>Page <PageNumber /></Text>
            </Row>
          </PageFooter>
        </Document>
      </div>
    </div>
  )
}

function PdfClosingSummary({ statement }: { statement: Statement }) {
  const totals = calculateTotals(statement.transactions)
  const expectedClosingBalance =
    statement.openingBalancePaise + totals.totalCreditsPaise - totals.totalDebitsPaise
  const validation = validateStatement(statement)
  const mismatch = statement.closingBalancePaise - expectedClosingBalance

  return (
    <Column style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', padding: { top: 12 }, border: { top: `2px solid ${token('colors.ink')}` } }}>
        <Text style={{ fontSize: 12 }}>Closing balance</Text>
        <Text style={{ fontSize: 12, fontWeight: 700 }}>{formatCurrency(statement.closingBalancePaise)}</Text>
      </Row>
      {!validation.valid && (
        <Text style={{ padding: 8, border: `1px solid ${token('colors.warning')}`, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 9, lineHeight: 1.4 }}>
          Statement needs review: calculated closing balance {formatCurrency(expectedClosingBalance)};
          {' '}{mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
        </Text>
      )}
    </Column>
  )
}
