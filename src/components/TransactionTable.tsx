import { calculateRunningBalances, formatCurrency } from '../financial'
import type { Transaction } from '../types'
import { CreditDebitIndicator } from './CreditDebitIndicator'
import type { FinSyncLocale } from '../public-api'
import { formatDate } from '../financial'

interface TransactionTableProps {
  transactions: Transaction[]
  totalTransactions: number
  openingBalancePaise: number
  allTransactions: Transaction[]
  locale?: FinSyncLocale
}

export function TransactionTable({
  transactions,
  totalTransactions,
  openingBalancePaise,
  allTransactions,
  locale = 'en-IN',
}: TransactionTableProps) {
  const runningBalances = calculateRunningBalances({
    openingBalancePaise,
    closingBalancePaise: openingBalancePaise,
    accountHolder: '',
    accountNumber: '',
    accountType: '',
    currency: 'INR',
    statementPeriod: { start: '', end: '' },
    transactions: allTransactions,
  })
  const sortedTransactions = [...transactions].sort((first, second) =>
    second.date.localeCompare(first.date) ||
    second.id.localeCompare(first.id),
  )
  const balanceById = new Map(
    runningBalances.map((balance) => [balance.transactionId, balance.balancePaise]),
  )
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th aria-label="Transaction type" /><th className="amount-column">Amount</th><th className="amount-column">Running balance</th></tr></thead>
          <tbody>
            {sortedTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="date-cell">{formatDate(transaction.date, locale)}</td>
                <td className="description-cell"><strong>{transaction.description}</strong><span>{transaction.type === 'CREDIT' ? 'Money received' : 'Payment made'}</span></td>
                <td className="reference-cell">{transaction.reference}</td>
                <td className="type-cell"><CreditDebitIndicator type={transaction.type} /></td>
                <td className={`amount-cell ${transaction.type.toLowerCase()}`}>{transaction.type === 'CREDIT' ? '+' : '−'} {formatCurrency(transaction.amountPaise)}</td>
                <td className="amount-cell">{formatCurrency(balanceById.get(transaction.id) ?? openingBalancePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <p className="empty-state">
            {totalTransactions === 0
              ? 'No transactions were recorded for this statement period.'
              : 'No transactions match your search.'}
          </p>
        )}
      </div>
      <p className="table-footer">Showing {transactions.length} of {totalTransactions} transactions <span>•</span> All amounts in INR</p>
    </>
  )
}
