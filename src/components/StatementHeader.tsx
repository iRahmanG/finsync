import type { Statement } from '../types'

interface StatementHeaderProps {
  statement: Statement
  onDownload?: () => void
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export function StatementHeader({ statement, onDownload }: StatementHeaderProps) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">PERSONAL FINANCE</p>
        <h1>Account statement</h1>
        <p className="muted">
          {formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}
        </p>
      </div>
      {onDownload && (
        <button className="download-button" type="button" onClick={onDownload}>
          <span aria-hidden="true">↓</span> Download statement
        </button>
      )}
    </div>
  )
}
