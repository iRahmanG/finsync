import { calculateRunningBalances, formatCurrency, formatDate, formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
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

export function PdfStatement({ statement, onClose }: PdfStatementProps) {
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
        <PdfDocument statement={statement} />
      </div>
    </div>
  )
}

export function PdfDocument({ statement }: { statement: Statement }) {
  const balances = calculateRunningBalances(statement)
  const chronologicalTransactions = [...statement.transactions].sort((first, second) =>
    first.date.localeCompare(second.date),
  )
  const pages = Array.from(
    { length: Math.ceil(chronologicalTransactions.length / ROWS_PER_PAGE) },
    (_, pageIndex) => chronologicalTransactions.slice(pageIndex * ROWS_PER_PAGE, (pageIndex + 1) * ROWS_PER_PAGE),
  )
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
  )
  const documentPages = pages.length === 0 ? [[]] : pages

  return (
    <Document
          theme={finsyncHyperTheme}
          size="A4"
          margin={{ top: 48, right: 48, bottom: 48, left: 48 }}
          title="FinSync account statement"
          style={{ gap: 24, color: token('colors.ink'), fontFamily: 'DM Sans, Arial, sans-serif', backgroundColor: token('colors.surface') }}
        >
          <PageHeader style={{ padding: { bottom: 16 }, border: { bottom: { width: 1, style: 'solid', color: '#E4E9E6' } } }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 700, color: token('colors.primary') }}>finsync</Text>
              <Text style={{ fontSize: 10, color: token('colors.muted') }}>
                {statementPeriod}
              </Text>
            </Row>
          </PageHeader>
          {documentPages.map((page, pageIndex) => (
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
              <Table style={{ width: '100%', fontSize: 9, border: { width: 1, style: 'solid', color: '#E4E9E6' }, cellPadding: [10, 6] }}>
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
              {page.length === 0 && (
                <Text style={{ padding: 18, border: { width: 1, style: 'solid', color: '#E4E9E6' }, borderRadius: 8, backgroundColor: token('colors.surfaceSubtle'), color: token('colors.muted'), fontSize: 11, textAlign: 'center' }}>
                  No transactions were recorded for this statement period.
                </Text>
              )}
              {pageIndex === documentPages.length - 1 && <PdfClosingSummary statement={statement} />}
            </Document.Page>
          ))}
          <PageFooter style={{ border: { top: { width: 1, style: 'solid', color: '#E4E9E6' } }, padding: { top: 10 } }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>FinSync • Confidential</Text>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>Synthetic demonstration</Text>
              <Text style={{ fontSize: 9, color: token('colors.muted') }}>Page <PageNumber /></Text>
            </Row>
          </PageFooter>
    </Document>
  )
}

function PdfClosingSummary({ statement }: { statement: Statement }) {
  const reconciliation = getReconciliation(statement)
  const mismatch = reconciliation.differencePaise

  return (
    <Column style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between', padding: { top: 12 }, border: { top: { width: 2, style: 'solid', color: '#182A38' } } }}>
        <Text style={{ fontSize: 12 }}>Closing balance</Text>
        <Text style={{ fontSize: 12, fontWeight: 700 }}>{formatCurrency(statement.closingBalancePaise)}</Text>
      </Row>
      {!reconciliation.valid && (
        <Text style={{ padding: 8, border: { width: 1, style: 'solid', color: '#9A6700' }, backgroundColor: token('colors.warningSoft'), color: token('colors.warning'), fontSize: 9, lineHeight: 1.4 }}>
          Statement needs review: calculated closing balance {formatCurrency(reconciliation.expectedClosingBalancePaise)};
          {' '}{mismatch > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(mismatch))}.
        </Text>
      )}
    </Column>
  )
}
