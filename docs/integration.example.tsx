import { FinSyncStatement } from '../src'
import type { Statement } from '../src'

const statement: Statement = {
  accountHolder: 'Meera Shah',
  accountNumber: '•••• 7391',
  accountType: 'Current Account',
  currency: 'INR',
  statementPeriod: { start: '2025-01-01', end: '2025-01-31' },
  openingBalancePaise: 750_000_00,
  closingBalancePaise: 980_500_00,
  transactions: [
    {
      id: 'alt-credit-1',
      date: '2025-01-03',
      description: 'Consulting invoice payment',
      reference: 'NEFT/MSH/0103',
      type: 'CREDIT',
      amountPaise: 280_000_00,
      balancePaise: 1_030_000_00,
    },
    {
      id: 'alt-debit-1',
      date: '2025-01-08',
      description: 'Office lease transfer',
      reference: 'UPI/LEASE/0108',
      type: 'DEBIT',
      amountPaise: 125_000_00,
      balancePaise: 905_000_00,
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
