import type { Statement, Transaction } from './types'
import type { FinSyncLocale } from './public-api'

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

const ensureSafeArithmetic = (value: number, operation: string): number => {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Arithmetic overflow while calculating ${operation}`)
  }
  return value
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
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
      if (transaction.type !== 'CREDIT' && transaction.type !== 'DEBIT') {
        throw new Error(`Invalid transaction type: ${String(transaction.type)}`)
      }
      if (transaction.type === 'CREDIT') {
        totals.totalCreditsPaise = ensureSafeArithmetic(
          totals.totalCreditsPaise + transaction.amountPaise,
          'credit totals',
        )
      } else {
        totals.totalDebitsPaise = ensureSafeArithmetic(
          totals.totalDebitsPaise + transaction.amountPaise,
          'debit totals',
        )
      }
      return totals
    },
    { totalCreditsPaise: 0, totalDebitsPaise: 0 },
  )
}

export function calculateRunningBalances(statement: Statement): RunningBalance[] {
  if (!isIntegerPaise(statement.openingBalancePaise)) {
    throw new Error('Opening balance must be a non-negative integer number of paise')
  }
  let balancePaise = statement.openingBalancePaise
  const chronologicalTransactions = statement.transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((first, second) =>
      first.transaction.date.localeCompare(second.transaction.date) ||
      first.index - second.index,
    )
  return chronologicalTransactions.map(({ transaction }) => {
    if (transaction.type !== 'CREDIT' && transaction.type !== 'DEBIT') {
      throw new Error(`Invalid transaction type: ${String(transaction.type)}`)
    }
    if (!isIntegerPaise(transaction.amountPaise)) {
      throw new Error(`Invalid amount for transaction ${transaction.id}`)
    }
    balancePaise = ensureSafeArithmetic(
      transaction.type === 'CREDIT'
        ? balancePaise + transaction.amountPaise
        : balancePaise - transaction.amountPaise,
      `running balance for ${transaction.id}`,
    )
    return { transactionId: transaction.id, balancePaise }
  })
}

export function validateStatement(statement: Statement): ValidationResult {
  const errors: string[] = []
  const transactions = Array.isArray(statement.transactions) ? statement.transactions : []
  const periodStart = statement.statementPeriod?.start ?? ''
  const periodEnd = statement.statementPeriod?.end ?? ''
  let totals: StatementTotals = { totalCreditsPaise: 0, totalDebitsPaise: 0 }
  try {
    totals = calculateTotals(
      transactions.filter((transaction) =>
        (transaction.type === 'CREDIT' || transaction.type === 'DEBIT') &&
        isIntegerPaise(transaction.amountPaise),
      ),
    )
  } catch {
    totals = { totalCreditsPaise: 0, totalDebitsPaise: 0 }
  }

  let runningBalances: RunningBalance[] = []
  if (isIntegerPaise(statement.openingBalancePaise)) {
    try {
      runningBalances = calculateRunningBalances({
        ...statement,
        transactions: transactions.filter((transaction) =>
          (transaction.type === 'CREDIT' || transaction.type === 'DEBIT') &&
          isIntegerPaise(transaction.amountPaise),
        ),
        openingBalancePaise: statement.openingBalancePaise,
      })
    } catch {
      runningBalances = []
    }
  }

  for (const field of REQUIRED_ACCOUNT_FIELDS) {
    if (typeof statement[field] !== 'string' || statement[field].trim() === '') {
      errors.push(`Missing required field: ${field}`)
    }
  }
  if (statement.currency !== 'INR') errors.push('Currency must be INR')
  if (!statement.statementPeriod?.start || !statement.statementPeriod?.end) {
    errors.push('Missing required field: statementPeriod')
  } else {
    if (!isValidIsoDate(statement.statementPeriod.start)) {
      errors.push('Invalid statement period start date')
    }
    if (!isValidIsoDate(statement.statementPeriod.end)) {
      errors.push('Invalid statement period end date')
    }
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
    if (transaction.type !== 'CREDIT' && transaction.type !== 'DEBIT') {
      errors.push(`Invalid transaction type for transaction ${transaction.id || index + 1}`)
    }
    if (!isIntegerPaise(transaction.amountPaise)) {
      errors.push(`Invalid amount for transaction ${transaction.id || index + 1}`)
    }
    if (!isValidIsoDate(transaction.date)) {
      errors.push(`Invalid date for transaction ${transaction.id || index + 1}`)
    } else if (transaction.date < periodStart || transaction.date > periodEnd) {
      errors.push(`Transaction ${transaction.id || index + 1} is outside the statement period`)
    }
  })

  const expectedClosingBalance = isIntegerPaise(statement.openingBalancePaise)
    ? ensureSafeArithmetic(
        ensureSafeArithmetic(
          ensureSafeArithmetic(statement.openingBalancePaise + totals.totalCreditsPaise, 'expected closing credit total'),
          'expected closing validation',
        ) - totals.totalDebitsPaise,
        'expected closing debit total',
      )
    : 0
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

export function formatCurrency(amountPaise: number, locale: FinSyncLocale = 'en-IN'): string {
  if (typeof amountPaise !== 'number' || !Number.isSafeInteger(amountPaise)) {
    throw new Error('Currency amount must be an integer number of paise')
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100)
}

export function formatExportCurrency(amountPaise: number, locale: FinSyncLocale = 'en-IN'): string {
  if (typeof amountPaise !== 'number' || !Number.isSafeInteger(amountPaise)) {
    throw new Error('Currency amount must be an integer number of paise')
  }
  return new Intl.NumberFormat(locale, {
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

export function categoryFor(description: string): string {
  const value = description.toLowerCase()
  if (value.includes('rent')) return 'Housing'
  if (value.includes('grocery')) return 'Groceries'
  if (value.includes('electricity')) return 'Utilities'
  if (value.includes('restaurant')) return 'Dining'
  return 'Uncategorized'
}

export function formatStatementPeriod(start: string, end: string, locale: FinSyncLocale = 'en-IN'): string {
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${date}T00:00:00`))
  return `${formatDate(start)} — ${formatDate(end)}`
}

export function formatDate(date: string, locale: FinSyncLocale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function getReconciliation(statement: Statement): {
  valid: boolean
  expectedClosingBalancePaise: number
  differencePaise: number
} {
  const totals = calculateTotals(
    statement.transactions.filter((transaction) =>
      (transaction.type === 'CREDIT' || transaction.type === 'DEBIT') &&
      isIntegerPaise(transaction.amountPaise),
    ),
  )
  if (!isIntegerPaise(statement.openingBalancePaise)) {
    return {
      valid: false,
      expectedClosingBalancePaise: 0,
      differencePaise: Number.isSafeInteger(statement.closingBalancePaise)
        ? statement.closingBalancePaise
        : 0,
    }
  }
  let expectedClosingBalancePaise = 0
  try {
    const openingAndCredits = ensureSafeArithmetic(
      statement.openingBalancePaise + totals.totalCreditsPaise,
      'expected closing credit total',
    )
    expectedClosingBalancePaise = ensureSafeArithmetic(
      openingAndCredits - totals.totalDebitsPaise,
      'expected closing debit total',
    )
  } catch {
    return {
      valid: false,
      expectedClosingBalancePaise: 0,
      differencePaise: Number.isSafeInteger(statement.closingBalancePaise)
        ? statement.closingBalancePaise
        : 0,
    }
  }
  const differencePaise = statement.closingBalancePaise - expectedClosingBalancePaise
  return {
    valid: differencePaise === 0,
    expectedClosingBalancePaise,
    differencePaise,
  }
}
