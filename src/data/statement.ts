import type { Statement } from '../types'

export const statement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 18245000,
  closingBalancePaise: 24468350,
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

export interface StatementProfile {
  id: string
  label: string
  statement: Statement
  interveningActivity?: string
}

export const statementProfiles: StatementProfile[] = [
  {
    id: '2024-06',
    label: 'June 2024 · Savings',
    statement,
  },
  {
    id: '2025-03',
    label: 'March 2025 · Savings',
    interveningActivity: 'Between 30 June 2024 and 01 March 2025: net account balance movement of ₹678,816.50.',
    statement: {
      accountHolder: 'Maksud Rahman',
      accountNumber: '•••• 4821',
      accountType: 'Savings Account',
      currency: 'INR',
      statementPeriod: { start: '2025-03-01', end: '2025-03-31' },
      openingBalancePaise: 92_350_000,
      closingBalancePaise: 91_550_000,
      transactions: [
        { id: 'mar25-01', date: '2025-03-03', description: 'Client retainer payment', reference: 'NEFT/PRN/0303', type: 'CREDIT', amountPaise: 2_500_000, balancePaise: 94_850_000 },
        { id: 'mar25-02', date: '2025-03-07', description: 'Vendor equipment transfer', reference: 'RTGS/VEN/0307', type: 'DEBIT', amountPaise: 1_850_000, balancePaise: 93_000_000 },
        { id: 'mar25-03', date: '2025-03-12', description: 'Interest credit', reference: 'INT/ACCT/0312', type: 'CREDIT', amountPaise: 180_000, balancePaise: 93_180_000 },
        { id: 'mar25-04', date: '2025-03-18', description: 'Monthly payroll', reference: 'UPI/PAY/0318', type: 'DEBIT', amountPaise: 950_000, balancePaise: 92_230_000 },
        { id: 'mar25-05', date: '2025-03-24', description: 'GST payment', reference: 'GST/CHN/0324', type: 'DEBIT', amountPaise: 540_000, balancePaise: 91_690_000 },
        { id: 'mar25-06', date: '2025-03-28', description: 'Office utilities', reference: 'BBPS/UTIL/0328', type: 'DEBIT', amountPaise: 140_000, balancePaise: 91_550_000 },
      ],
    },
  },
  {
    id: '2025-09',
    label: 'September 2025 · Savings',
    interveningActivity: 'Between 31 March 2025 and 01 September 2025: net account balance movement of -₹831,000.00.',
    statement: {
      accountHolder: 'Maksud Rahman',
      accountNumber: '•••• 4821',
      accountType: 'Savings Account',
      currency: 'INR',
      statementPeriod: { start: '2025-09-01', end: '2025-09-30' },
      openingBalancePaise: 8_450_000,
      closingBalancePaise: 15_085_000,
      transactions: [
        { id: 'sep25-01', date: '2025-09-02', description: 'Fixed deposit maturity', reference: 'FD/MAT/0902', type: 'CREDIT', amountPaise: 9_200_000, balancePaise: 17_650_000 },
        { id: 'sep25-02', date: '2025-09-05', description: 'Home loan repayment', reference: 'ECS/HLN/0905', type: 'DEBIT', amountPaise: 3_200_000, balancePaise: 14_450_000 },
        { id: 'sep25-03', date: '2025-09-11', description: 'Grocery shopping', reference: 'POS/DMART/0911', type: 'DEBIT', amountPaise: 780_000, balancePaise: 13_670_000 },
        { id: 'sep25-04', date: '2025-09-15', description: 'Dividend credit', reference: 'INT/DIV/0915', type: 'CREDIT', amountPaise: 2_200_000, balancePaise: 15_870_000 },
        { id: 'sep25-05', date: '2025-09-19', description: 'Car insurance premium', reference: 'INS/CAR/0919', type: 'DEBIT', amountPaise: 450_000, balancePaise: 15_420_000 },
        { id: 'sep25-06', date: '2025-09-23', description: 'Restaurant & dining', reference: 'CARD/DINE/0923', type: 'DEBIT', amountPaise: 210_000, balancePaise: 15_210_000 },
        { id: 'sep25-07', date: '2025-09-27', description: 'Mobile recharge', reference: 'BBPS/MOB/0927', type: 'DEBIT', amountPaise: 125_000, balancePaise: 15_085_000 },
      ],
    },
  },
  {
    id: '2026-01',
    label: 'January 2026 · Salary',
    interveningActivity: 'Between 30 September 2025 and 01 January 2026: net account balance movement of ₹0.00; no intervening balance change is assumed.',
    statement: {
      accountHolder: 'Maksud Rahman',
      accountNumber: '•••• 4821',
      accountType: 'Savings Account',
      currency: 'INR',
      statementPeriod: { start: '2026-01-01', end: '2026-01-31' },
      openingBalancePaise: 15_085_000,
      closingBalancePaise: 21_483_000,
      transactions: [
        { id: 'jan26-01', date: '2026-01-01', description: 'Salary credit', reference: 'SAL/JAN/2026', type: 'CREDIT', amountPaise: 7_800_000, balancePaise: 22_885_000 },
        { id: 'jan26-02', date: '2026-01-05', description: 'House rent payment', reference: 'UPI/RENT/0105', type: 'DEBIT', amountPaise: 1_250_000, balancePaise: 21_635_000 },
        { id: 'jan26-03', date: '2026-01-10', description: 'Mutual fund investment', reference: 'SIP/FUND/0110', type: 'DEBIT', amountPaise: 340_000, balancePaise: 21_295_000 },
        { id: 'jan26-04', date: '2026-01-14', description: 'Cashback received', reference: 'CBK/CARD/0114', type: 'CREDIT', amountPaise: 450_000, balancePaise: 21_745_000 },
        { id: 'jan26-05', date: '2026-01-18', description: 'Grocery shopping', reference: 'POS/MART/0118', type: 'DEBIT', amountPaise: 185_000, balancePaise: 21_560_000 },
        { id: 'jan26-06', date: '2026-01-23', description: 'Electricity bill', reference: 'BBPS/ELEC/0123', type: 'DEBIT', amountPaise: 95_000, balancePaise: 21_465_000 },
        { id: 'jan26-07', date: '2026-01-28', description: 'Interest credit', reference: 'INT/SAV/0128', type: 'CREDIT', amountPaise: 60_000, balancePaise: 21_525_000 },
        { id: 'jan26-08', date: '2026-01-30', description: 'Dining & entertainment', reference: 'CARD/DINE/0130', type: 'DEBIT', amountPaise: 42_000, balancePaise: 21_483_000 },
      ],
    },
  },
  {
    id: '2026-10',
    label: 'October 2026 · Savings',
    interveningActivity: 'Between 31 January 2026 and 01 October 2026: net account balance movement of ₹0.00; no intervening balance change is assumed.',
    statement: {
      accountHolder: 'Maksud Rahman',
      accountNumber: '•••• 4821',
      accountType: 'Savings Account',
      currency: 'INR',
      statementPeriod: { start: '2026-10-01', end: '2026-10-31' },
      openingBalancePaise: 21_483_000,
      closingBalancePaise: 25_473_000,
      transactions: [
        { id: 'oct26-01', date: '2026-10-02', description: 'Business project payout', reference: 'RTGS/PROJ/1002', type: 'CREDIT', amountPaise: 6_800_000, balancePaise: 28_283_000 },
        { id: 'oct26-02', date: '2026-10-08', description: 'Apartment maintenance', reference: 'UPI/MAINT/1008', type: 'DEBIT', amountPaise: 2_450_000, balancePaise: 25_833_000 },
        { id: 'oct26-03', date: '2026-10-12', description: 'International transfer refund', reference: 'NEFT/RFD/1012', type: 'CREDIT', amountPaise: 950_000, balancePaise: 26_783_000 },
        { id: 'oct26-04', date: '2026-10-16', description: 'Travel booking', reference: 'CARD/TRAVEL/1016', type: 'DEBIT', amountPaise: 680_000, balancePaise: 26_103_000 },
        { id: 'oct26-05', date: '2026-10-20', description: 'Health insurance premium', reference: 'INS/HLT/1020', type: 'DEBIT', amountPaise: 325_000, balancePaise: 25_778_000 },
        { id: 'oct26-06', date: '2026-10-25', description: 'Fuel purchase', reference: 'POS/FUEL/1025', type: 'DEBIT', amountPaise: 180_000, balancePaise: 25_598_000 },
        { id: 'oct26-07', date: '2026-10-29', description: 'Online subscription', reference: 'CARD/SUB/1029', type: 'DEBIT', amountPaise: 125_000, balancePaise: 25_473_000 },
      ],
    },
  },
]

export const defaultStatementProfile = statementProfiles[0]
