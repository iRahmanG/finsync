import * as React from 'react'
void React
import { TableCell, TableRow } from '@hyper-elements/react'
import { token } from '../theme'
import { formatDate, formatCurrency, formatExportCurrency } from '../financial'
import type { Transaction } from '../types'
import type { FinSyncLocale } from '../public-api'

export interface TransactionRowProps {
  transaction: Transaction
  locale?: FinSyncLocale
  showReference?: boolean
  showType?: boolean
  runningBalancePaise?: number
  padding?: [number, number]
  fontSize?: number
  useExportCurrency?: boolean
}

export function TransactionRow({
  transaction,
  locale = 'en-IN',
  showReference = false,
  showType = false,
  runningBalancePaise,
  padding = [8, 5],
  fontSize,
  useExportCurrency = false,
}: TransactionRowProps) {
  const isCredit = transaction.type === 'CREDIT'
  const sign = isCredit ? '+' : '-'
  const typeColor = isCredit ? token('colors.primary') : token('colors.debit')
  const formatter = useExportCurrency ? formatExportCurrency : formatCurrency
  const formattedAmount = `${sign} ${formatter(transaction.amountPaise, locale)}`
  const cellStyle = { padding, ...(fontSize ? { fontSize } : {}) }

  return (
    <TableRow>
      <TableCell style={{ ...cellStyle, color: token('colors.muted') }}>
        {formatDate(transaction.date, locale)}
      </TableCell>
      <TableCell style={cellStyle}>
        {transaction.description}
      </TableCell>
      {showReference && (
        <TableCell
          style={{
            ...cellStyle,
            fontFamily: 'DM Mono, monospace',
            color: token('colors.muted'),
            letterSpacing: 0.2,
          }}
        >
          {transaction.reference}
        </TableCell>
      )}
      {showType && (
        <TableCell style={{ ...cellStyle, fontWeight: 700, color: typeColor }}>
          {transaction.type}
        </TableCell>
      )}
      <TableCell
        style={{
          ...cellStyle,
          textAlign: 'right',
          fontWeight: 700,
          color: typeColor,
        }}
      >
        {formattedAmount}
      </TableCell>
      {runningBalancePaise !== undefined && (
        <TableCell
          style={{
            ...cellStyle,
            textAlign: 'right',
            fontWeight: 700,
          }}
        >
          {formatter(runningBalancePaise, locale)}
        </TableCell>
      )}
    </TableRow>
  )
}
