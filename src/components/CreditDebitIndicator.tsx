import type { Transaction } from '../types'

interface CreditDebitIndicatorProps {
  type: Transaction['type']
  showLabel?: boolean
}

export function CreditDebitIndicator({ type, showLabel = false }: CreditDebitIndicatorProps) {
  const isCredit = type === 'CREDIT'
  return (
    <span className={`transaction-indicator ${isCredit ? 'credit' : 'debit'}`}>
      <span className="transaction-dot" aria-hidden="true" />
      {showLabel && (isCredit ? 'Credit' : 'Debit')}
    </span>
  )
}
