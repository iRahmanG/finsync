import type { Statement, Transaction } from './types'

export type StatementInput = Partial<Omit<Statement, 'statementPeriod' | 'transactions'>> & {
  statementPeriod?: Partial<Statement['statementPeriod']>
  transactions?: Array<Partial<Transaction>>
}

export interface StatementTotals {
  totalCreditsPaise: number
  totalDebitsPaise: number
}

export interface RunningBalance {
  transactionId: string
  balancePaise: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  totals: StatementTotals
  runningBalances: RunningBalance[]
}

const REQUIRED_ACCOUNT_FIELDS: Array<keyof Statement> = [
  'accountHolder',
  'accountNumber',
  'accountType',
  'currency',
]

const isIntegerPaise = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const normalizeDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`)
  }
  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}`)
  }
  return value
}

const normalizeAmount = (value: unknown, fieldName: string): number => {
  if (!isIntegerPaise(value)) {
    throw new Error(`${fieldName} must be a non-negative integer number of paise`)
  }
  return value
}

export function normalizeStatement(input: StatementInput): Statement {
  if (!input || typeof input !== 'object') {
    throw new Error('Statement input is required')
  }
  const period = input.statementPeriod
  const transactions = input.transactions
  if (!period || !transactions) {
    throw new Error('Statement period and transactions are required')
  }
  if (input.currency !== 'INR') {
    throw new Error('Currency must be INR')
  }

  const statement: Statement = {
    accountHolder: input.accountHolder?.trim() ?? '',
    accountNumber: input.accountNumber?.trim() ?? '',
    accountType: input.accountType?.trim() ?? '',
    currency: 'INR',
    statementPeriod: {
      start: normalizeDate(period.start ?? ''),
      end: normalizeDate(period.end ?? ''),
    },
    openingBalancePaise: normalizeAmount(input.openingBalancePaise, 'openingBalancePaise'),
    closingBalancePaise: normalizeAmount(input.closingBalancePaise, 'closingBalancePaise'),
    transactions: transactions.map((transaction) => {
      if (transaction.type !== 'CREDIT' && transaction.type !== 'DEBIT') {
        throw new Error(`Invalid transaction type: ${String(transaction.type)}`)
      }
      return {
        id: transaction.id?.trim() ?? '',
        date: normalizeDate(transaction.date ?? ''),
        description: transaction.description?.trim() ?? '',
        reference: transaction.reference?.trim() ?? '',
        type: transaction.type,
        amountPaise: normalizeAmount(transaction.amountPaise, 'amountPaise'),
        ...(transaction.balancePaise === undefined
          ? {}
          : { balancePaise: normalizeAmount(transaction.balancePaise, 'balancePaise') }),
      }
    }),
  }

  return statement
}

export function calculateTotals(transactions: Transaction[]): StatementTotals {
  return transactions.reduce<StatementTotals>(
    (totals, transaction) => {
      if (transaction.type === 'CREDIT') {
        totals.totalCreditsPaise += transaction.amountPaise
      } else {
        totals.totalDebitsPaise += transaction.amountPaise
      }
      return totals
    },
    { totalCreditsPaise: 0, totalDebitsPaise: 0 },
  )
}

export function calculateRunningBalances(statement: Statement): RunningBalance[] {
  let balancePaise = statement.openingBalancePaise
  const chronologicalTransactions = statement.transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((first, second) =>
      first.transaction.date.localeCompare(second.transaction.date) ||
      first.index - second.index,
    )
  return chronologicalTransactions.map(({ transaction }) => {
    balancePaise += transaction.type === 'CREDIT' ? transaction.amountPaise : -transaction.amountPaise
    return { transactionId: transaction.id, balancePaise }
  })
}

export function validateStatement(statement: Statement): ValidationResult {
  const errors: string[] = []
  const transactions = Array.isArray(statement.transactions) ? statement.transactions : []
  const periodStart = statement.statementPeriod?.start ?? ''
  const periodEnd = statement.statementPeriod?.end ?? ''
  const totals = calculateTotals(transactions)
  const runningBalances = calculateRunningBalances({
    ...statement,
    transactions,
    openingBalancePaise: isIntegerPaise(statement.openingBalancePaise)
      ? statement.openingBalancePaise
      : 0,
  })

  for (const field of REQUIRED_ACCOUNT_FIELDS) {
    if (typeof statement[field] !== 'string' || statement[field].trim() === '') {
      errors.push(`Missing required field: ${field}`)
    }
  }
  if (statement.currency !== 'INR') errors.push('Currency must be INR')
  if (!statement.statementPeriod?.start || !statement.statementPeriod?.end) {
    errors.push('Missing required field: statementPeriod')
  }
  if (periodStart && periodEnd && periodStart > periodEnd) {
    errors.push('Statement period start must be before its end')
  }
  if (!isIntegerPaise(statement.openingBalancePaise)) errors.push('Invalid opening balance')
  if (!isIntegerPaise(statement.closingBalancePaise)) errors.push('Invalid closing balance')

  const ids = new Set<string>()
  transactions.forEach((transaction, index) => {
    if (!transaction.id) errors.push(`Transaction ${index + 1} is missing an ID`)
    if (ids.has(transaction.id)) errors.push(`Duplicate transaction ID: ${transaction.id}`)
    ids.add(transaction.id)
    if (!isIntegerPaise(transaction.amountPaise)) {
      errors.push(`Invalid amount for transaction ${transaction.id || index + 1}`)
    }
    if (transaction.date < periodStart || transaction.date > periodEnd) {
      errors.push(`Transaction ${transaction.id || index + 1} is outside the statement period`)
    }
  })

  const expectedClosingBalance =
    statement.openingBalancePaise + totals.totalCreditsPaise - totals.totalDebitsPaise
  if (statement.closingBalancePaise !== expectedClosingBalance) {
    errors.push(
      `Closing balance mismatch: expected ${expectedClosingBalance}, received ${statement.closingBalancePaise}`,
    )
  }

  const balancesByTransactionId = new Map(
    runningBalances.map((runningBalance) => [runningBalance.transactionId, runningBalance.balancePaise]),
  )
  transactions.forEach((transaction, index) => {
    if (transaction.balancePaise !== undefined && transaction.balancePaise !== balancesByTransactionId.get(transaction.id)) {
      errors.push(`Incorrect running balance for transaction ${transaction.id || index + 1}`)
    }
  })

  return { valid: errors.length === 0, errors, totals, runningBalances }
}

export function formatCurrency(amountPaise: number): string {
  if (typeof amountPaise !== 'number' || !Number.isSafeInteger(amountPaise)) {
    throw new Error('Currency amount must be an integer number of paise')
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100)
}

export function maskAccountNumber(accountNumber: string): string {
  const trimmed = accountNumber.trim()
  if (!trimmed) return ''

  const digits = trimmed.match(/\d/g)
  if (!digits) return '••••'

  const lastFour = digits.slice(-4).join('')
  return `•••• ${lastFour}`
}
