import type { Statement, Transaction } from './types'

export const reconciledStatement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 5_000_000,
  closingBalancePaise: 5_250_000,
  transactions: [
    { id: 'credit-1', date: '2024-06-10', description: 'Salary', reference: 'SAL-001', type: 'CREDIT', amountPaise: 350_000, balancePaise: 5_350_000 },
    { id: 'debit-1', date: '2024-06-20', description: 'Rent', reference: 'UPI-001', type: 'DEBIT', amountPaise: 100_000, balancePaise: 5_250_000 },
  ],
}

export const emptyStatement: Statement = {
  ...reconciledStatement,
  closingBalancePaise: reconciledStatement.openingBalancePaise,
  transactions: [],
}

export const mismatchStatement: Statement = {
  ...reconciledStatement,
  closingBalancePaise: 5_251_000,
}

export function createManyTransactions(count = 24): Transaction[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `txn-${String(index + 1).padStart(3, '0')}`,
    date: `2024-06-${String((index % 28) + 1).padStart(2, '0')}`,
    description: index % 2 === 0
      ? 'Synthetic recurring credit with a deliberately descriptive merchant label'
      : 'Synthetic monthly debit for reusable template verification',
    reference: `SYN/${String(index + 1).padStart(4, '0')}`,
    type: index % 3 === 0 ? 'CREDIT' : 'DEBIT',
    amountPaise: 10_000 + index * 137,
  }))
}

export const manyTransactionStatement: Statement = {
  ...reconciledStatement,
  openingBalancePaise: 10_000_000,
  closingBalancePaise: 10_000_000,
  transactions: createManyTransactions(),
}

export const longDescriptionStatement: Statement = {
  ...reconciledStatement,
  transactions: [{
    ...reconciledStatement.transactions[0],
    description: 'A deliberately long synthetic transaction description used to verify wrapping and overflow behavior across web email PDF and canvas outputs',
  }],
  closingBalancePaise: 5_350_000,
}

export const alternateStatement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Current Account',
  currency: 'INR',
  statementPeriod: { start: '2025-01-01', end: '2025-01-31' },
  openingBalancePaise: 75_000_00,
  closingBalancePaise: 98_050_00,
  transactions: [
    { id: 'alt-credit-1', date: '2025-01-03', description: 'Consulting invoice payment', reference: 'NEFT/MSH/0103', type: 'CREDIT', amountPaise: 28_000_00, balancePaise: 103_000_00 },
    { id: 'alt-debit-1', date: '2025-01-08', description: 'Office lease transfer', reference: 'UPI/LEASE/0108', type: 'DEBIT', amountPaise: 12_500_00, balancePaise: 90_500_00 },
    { id: 'alt-debit-2', date: '2025-01-15', description: 'Cloud infrastructure subscription', reference: 'CARD/CLOUD/0115', type: 'DEBIT', amountPaise: 1_500_00, balancePaise: 89_000_00 },
    { id: 'alt-credit-2', date: '2025-01-22', description: 'Client milestone payout', reference: 'RTGS/MSH/0122', type: 'CREDIT', amountPaise: 10_000_00, balancePaise: 99_000_00 },
    { id: 'alt-debit-3', date: '2025-01-27', description: 'Travel reimbursement', reference: 'UPI/TRAVEL/0127', type: 'DEBIT', amountPaise: 950_00, balancePaise: 98_050_00 },
  ],
}
