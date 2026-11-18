import type { Statement } from '../types'

export const statement: Statement = {
  accountHolder: 'Aarav Mehta',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 18245000,
  closingBalancePaise: 24787500,
  transactions: [
    { id: 'txn-01', date: '2024-06-28', description: 'Salary credit', reference: 'SAL/JUN/2024', type: 'CREDIT', amountPaise: 8500000 },
    { id: 'txn-02', date: '2024-06-26', description: 'Rent payment', reference: 'UPI/RENT/0624', type: 'DEBIT', amountPaise: 2800000 },
    { id: 'txn-03', date: '2024-06-24', description: 'Grocery shopping', reference: 'POS/DMART/9482', type: 'DEBIT', amountPaise: 328750 },
    { id: 'txn-04', date: '2024-06-21', description: 'Freelance payment', reference: 'NEFT/FRL/2189', type: 'CREDIT', amountPaise: 1250000 },
    { id: 'txn-05', date: '2024-06-18', description: 'Electricity bill', reference: 'BBPS/BESCOM/621', type: 'DEBIT', amountPaise: 164800 },
    { id: 'txn-06', date: '2024-06-15', description: 'Restaurant & dining', reference: 'CARD/FOOD/7731', type: 'DEBIT', amountPaise: 245600 },
    { id: 'txn-07', date: '2024-06-10', description: 'Cashback received', reference: 'CBK/AMZ/0601', type: 'CREDIT', amountPaise: 12500 },
  ],
}
