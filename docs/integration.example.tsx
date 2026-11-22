import { FinSyncStatement } from '../src'
import type { Statement } from '../src'

const statement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 18_245_000,
  closingBalancePaise: 23_945_000,
  transactions: [
    {
      id: 'txn-01',
      date: '2024-06-28',
      description: 'Salary credit',
      reference: 'SAL/JUN/2024',
      type: 'CREDIT',
      amountPaise: 8_500_000,
      balancePaise: 26_745_000,
    },
    {
      id: 'txn-02',
      date: '2024-06-26',
      description: 'Rent payment',
      reference: 'UPI/RENT/0624',
      type: 'DEBIT',
      amountPaise: 2_800_000,
      balancePaise: 23_945_000,
    },
  ],
}

export function ExampleStatement() {
  return (
    <FinSyncStatement
      statement={statement}
      initialView="web"
      config={{
        brandName: 'Northstar',
        theme: {
          primaryColor: '#175CD3',
          textColor: '#182A38',
          mutedColor: '#667085',
          surfaceColor: '#FFFFFF',
          subtleSurfaceColor: '#F7F9FC',
          borderColor: '#E4E7EC',
          borderRadius: 8,
        },
      }}
    />
  )
}
