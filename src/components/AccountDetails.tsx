import type { Statement } from '../types'
import { maskAccountNumber, validateStatement } from '../financial'

interface AccountDetailsProps {
  statement: Statement
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export function AccountDetails({ statement }: AccountDetailsProps) {
  const validation = validateStatement(statement)
  const status = validation.valid ? 'Balanced' : 'Needs review'
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
        <strong>{formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}</strong>
        <span className="status-pill">{status}</span>
      </div>
    </section>
  )
}
