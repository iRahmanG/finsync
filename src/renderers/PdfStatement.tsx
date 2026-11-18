import { calculateRunningBalances, formatCurrency } from '../financial'
import type { Statement, Transaction } from '../types'

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
  const pages = Array.from(
    { length: Math.ceil(statement.transactions.length / ROWS_PER_PAGE) },
    (_, pageIndex) => statement.transactions.slice(pageIndex * ROWS_PER_PAGE, (pageIndex + 1) * ROWS_PER_PAGE),
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
        {pages.map((page, pageIndex) => (
          <PdfPage
            key={pageIndex}
            page={page}
            pageIndex={pageIndex}
            pageCount={pages.length}
            statement={statement}
            balances={balances}
          />
        ))}
      </div>
    </div>
  )
}

function PdfPage({
  page,
  pageIndex,
  pageCount,
  statement,
  balances,
}: {
  page: Transaction[]
  pageIndex: number
  pageCount: number
  statement: Statement
  balances: ReturnType<typeof calculateRunningBalances>
}) {
  return (
    <article className="pdf-page">
      <header className="pdf-header">
        <div className="brand"><span className="brand-mark">F</span><span>finsync</span></div>
        <div className="pdf-header-meta"><strong>ACCOUNT STATEMENT</strong><span>{formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}</span></div>
      </header>
      {pageIndex === 0 && (
        <div className="pdf-account">
          <div><span>ACCOUNT HOLDER</span><strong>{statement.accountHolder}</strong></div>
          <div><span>ACCOUNT</span><strong>{statement.accountNumber}</strong></div>
          <div><span>TYPE</span><strong>{statement.accountType}</strong></div>
        </div>
      )}
      <table className="pdf-table">
        <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Type</th><th>Amount</th><th>Running balance</th></tr></thead>
        <tbody>
          {page.map((transaction) => {
            const transactionIndex = statement.transactions.findIndex(({ id }) => id === transaction.id)
            return (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.date)}</td>
                <td><strong>{transaction.description}</strong></td>
                <td>{transaction.reference}</td>
                <td className={transaction.type.toLowerCase()}>{transaction.type}</td>
                <td className={`pdf-amount ${transaction.type.toLowerCase()}`}>{transaction.type === 'CREDIT' ? '+' : '−'} {formatCurrency(transaction.amountPaise)}</td>
                <td>{formatCurrency(balances[transactionIndex].balancePaise)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {pageIndex === pageCount - 1 && (
        <div className="pdf-closing">
          <span>Closing balance</span><strong>{formatCurrency(statement.closingBalancePaise)}</strong>
        </div>
      )}
      <footer className="pdf-footer"><span>FinSync • Confidential</span><span>Statement period: {formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}</span><span>Page {pageIndex + 1} of {pageCount}</span></footer>
    </article>
  )
}
