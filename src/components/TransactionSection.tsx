import * as React from 'react'
void React
import { Column, Table, TableCell, TableRow, Text } from '@hyper-elements/react'
import { token } from '../theme'
import { TransactionRow } from './TransactionRow'
import { formatCurrency, formatExportCurrency } from '../financial'
import type { Transaction } from '../types'
import type { FinSyncLocale } from '../public-api'

export interface TransactionSectionProps {
  transactions: Transaction[]
  locale?: FinSyncLocale
  title?: string
  showReference?: boolean
  showType?: boolean
  showRunningBalance?: boolean
  balancesById?: Map<string, number>
  fallbackRunningBalance?: number
  closingBalancePaise?: number
  emptyMessage?: string
  cellPadding?: [number, number]
  fontSize?: number
  useExportCurrency?: boolean
}

export function TransactionSection({
  transactions,
  locale = 'en-IN',
  title,
  showReference = false,
  showType = false,
  showRunningBalance = false,
  balancesById,
  fallbackRunningBalance = 0,
  closingBalancePaise,
  emptyMessage,
  cellPadding = [10, 7],
  fontSize,
  useExportCurrency = false,
}: TransactionSectionProps) {
  if (transactions.length === 0 && emptyMessage) {
    return (
      <Text
        style={{
          padding: 14,
          border: { width: 1, style: 'solid', color: token('colors.line') },
          borderRadius: token('radii.sm'),
          backgroundColor: token('colors.surfaceSubtle'),
          color: token('colors.muted'),
          fontSize: 11,
          textAlign: 'center',
        }}
      >
        {emptyMessage}
      </Text>
    )
  }

  type WidthPercent = `${number}%`

  // Calculate deliberate column widths to prevent awkward mid-word breaks
  // in Description (e.g. "Health insurance premium") and prevent Reference IDs wrapping.
  let dateWidth: WidthPercent = '14%'
  let descWidth: WidthPercent = '42%'
  let refWidth: WidthPercent = '18%'
  let typeWidth: WidthPercent = '10%'
  let amountWidth: WidthPercent = '16%'
  let runningWidth: WidthPercent = '16%'

  if (showRunningBalance && showReference && showType) {
    // 6 columns (PDF)
    dateWidth = '13%'
    descWidth = '37%'
    refWidth = '16%'
    typeWidth = '10%'
    amountWidth = '12%'
    runningWidth = '12%'
  } else if (!showReference && !showType && !showRunningBalance) {
    // 3 columns (Email)
    dateWidth = '22%'
    descWidth = '53%'
    amountWidth = '25%'
  } else if (showReference && showType && !showRunningBalance) {
    // 5 columns (Web)
    dateWidth = '14%'
    descWidth = '44%'
    refWidth = '18%'
    typeWidth = '10%'
    amountWidth = '14%'
  }

  const headerFontSize = fontSize ? Math.max(7, fontSize - 1) : 10
  const formatter = useExportCurrency ? formatExportCurrency : formatCurrency
  const leadingColSpan = showReference && showType ? 4 : (showReference || showType) ? 3 : 2

  return (
    <Column style={{ gap: 8 }}>
      {title && <Text style={{ fontSize: 18, fontWeight: 700 }}>{title}</Text>}
      <Table
        style={{
          width: '100%',
          border: { width: 1, style: 'solid', color: token('colors.line') },
          cellPadding,
          ...(fontSize ? { fontSize } : {}),
        }}
      >
        <TableRow header style={{ backgroundColor: token('colors.surfaceSubtle') }}>
          <TableCell
            style={{
              width: dateWidth,
              padding: cellPadding,
              fontWeight: 700,
              fontSize: headerFontSize,
              color: token('colors.muted'),
            }}
          >
            Date
          </TableCell>
          <TableCell
            style={{
              width: descWidth,
              padding: cellPadding,
              fontWeight: 700,
              fontSize: headerFontSize,
              color: token('colors.muted'),
            }}
          >
            Description
          </TableCell>
          {showReference && (
            <TableCell
              style={{
                width: refWidth,
                padding: cellPadding,
                fontWeight: 700,
                fontSize: headerFontSize,
                color: token('colors.muted'),
              }}
            >
              Reference
            </TableCell>
          )}
          {showType && (
            <TableCell
              style={{
                width: typeWidth,
                padding: cellPadding,
                fontWeight: 700,
                fontSize: headerFontSize,
                color: token('colors.muted'),
              }}
            >
              Type
            </TableCell>
          )}
          <TableCell
            style={{
              width: amountWidth,
              padding: cellPadding,
              textAlign: 'right',
              fontWeight: 700,
              fontSize: headerFontSize,
              color: token('colors.muted'),
            }}
          >
            Amount
          </TableCell>
          {showRunningBalance && (
            <TableCell
              style={{
                width: runningWidth,
                padding: cellPadding,
                textAlign: 'right',
                fontWeight: 700,
                fontSize: headerFontSize,
                color: token('colors.muted'),
              }}
            >
              Running balance
            </TableCell>
          )}
        </TableRow>
        {transactions.map((transaction) => {
          const runningBalance = showRunningBalance
            ? (balancesById?.get(transaction.id) ?? fallbackRunningBalance)
            : undefined

          return (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              locale={locale}
              showReference={showReference}
              showType={showType}
              runningBalancePaise={runningBalance}
              padding={cellPadding}
              fontSize={fontSize}
              useExportCurrency={useExportCurrency}
            />
          )
        })}
        {closingBalancePaise !== undefined && (
          <TableRow footer style={{ backgroundColor: token('colors.surfaceSubtle') }}>
            <TableCell
              colSpan={leadingColSpan}
              style={{
                padding: cellPadding,
                textAlign: 'right',
                fontWeight: 700,
                fontSize: fontSize ?? 10,
                color: token('colors.ink'),
              }}
            >
              Closing balance
            </TableCell>
            <TableCell
              style={{
                padding: cellPadding,
                textAlign: 'right',
                fontWeight: 700,
                fontSize: fontSize ?? 10,
                color: token('colors.ink'),
              }}
            >
              {formatter(closingBalancePaise, locale)}
            </TableCell>
            {showRunningBalance && (
              <TableCell
                style={{
                  padding: cellPadding,
                  textAlign: 'right',
                  fontWeight: 700,
                  fontSize: fontSize ?? 10,
                  color: token('colors.ink'),
                }}
              >
                {formatter(closingBalancePaise, locale)}
              </TableCell>
            )}
          </TableRow>
        )}
      </Table>
    </Column>
  )
}
