import type { ReactNode } from 'react'
import type { Statement } from '../types'
import { formatCurrency } from '../financial'

interface AccountDetailsProps {
  statement: Statement
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export function AccountDetails({ statement }: AccountDetailsProps) {
  return (
    <section className="account-card" aria-label="Account details">
      <div className="account-info">
        <div className="bank-icon" aria-hidden="true">↗</div>
        <div>
          <p className="card-label">PRIMARY ACCOUNT</p>
          <h2>{statement.accountType}</h2>
          <p className="account-number">{statement.accountNumber}</p>
          <p className="account-holder">{statement.accountHolder}</p>
        </div>
      </div>
      <BalanceDetail label="CLOSING BALANCE" amountPaise={statement.closingBalancePaise}>
        <span className="balance-change">↑ 35.9% this month</span>
      </BalanceDetail>
      <div className="period-block">
        <p className="card-label">STATEMENT PERIOD</p>
        <strong>{formatDate(statement.statementPeriod.start)} — {formatDate(statement.statementPeriod.end)}</strong>
        <span className="status-pill">Up to date</span>
      </div>
    </section>
  )
}

interface BalanceDetailProps {
  label: string
  amountPaise: number
  children?: ReactNode
}

function BalanceDetail({ label, amountPaise, children }: BalanceDetailProps) {
  return (
    <div className="balance-block">
      <p className="card-label">{label}</p>
      <strong>{formatCurrency(amountPaise)}</strong>
      {children}
    </div>
  )
}
