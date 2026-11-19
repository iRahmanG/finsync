import type { Statement } from '../types'
import type { FinSyncLocale } from '../public-api'
import { formatStatementPeriod } from '../financial'

interface StatementHeaderProps {
  statement: Statement
  onDownload?: () => void
  locale?: FinSyncLocale
}

export function StatementHeader({ statement, onDownload, locale = 'en-IN' }: StatementHeaderProps) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">PERSONAL FINANCE</p>
        <h1>Account statement</h1>
        <p className="muted">
          {formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end, locale)}
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
