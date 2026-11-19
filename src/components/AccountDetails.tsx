import type { Statement } from '../types'
import { formatStatementPeriod, getReconciliation, maskAccountNumber } from '../financial'
import type { FinSyncLocale } from '../public-api'

interface AccountDetailsProps {
  statement: Statement
  locale?: FinSyncLocale
}

export function AccountDetails({ statement, locale = 'en-IN' }: AccountDetailsProps) {
  const reconciliation = getReconciliation(statement)
  const status = reconciliation.valid ? 'Balanced' : 'Needs review'
  return (
    <section className="account-card" aria-label="Account details">
      <div className="account-info">
        <div className="bank-icon" aria-hidden="true">↗</div>
        <div>
          <p className="card-label">PRIMARY ACCOUNT</p>
          <h2>{statement.accountType}</h2>
          <p className="account-number">{maskAccountNumber(statement.accountNumber)}</p>
          <p className="account-holder">{statement.accountHolder}</p>
        </div>
      </div>
      <div className="balance-block">
        <p className="card-label">ACCOUNT HOLDER</p>
        <strong className="account-holder-name">{statement.accountHolder}</strong>
        <span className="account-holder-detail">Synthetic demonstration account</span>
      </div>
      <div className="period-block">
        <p className="card-label">STATEMENT PERIOD</p>
        <strong>{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end, locale)}</strong>
        <span className="status-pill">{status}</span>
      </div>
    </section>
  )
}
