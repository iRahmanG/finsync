import * as React from 'react'
void React
import { Column, Row, Text } from '@hyper-elements/react'
import { token } from '../theme'
import { calculateTotals, formatCurrency, formatExportCurrency } from '../financial'
import type { Statement } from '../types'
import type { FinSyncLocale } from '../public-api'

export interface BalanceSummaryProps {
  statement: Statement
  locale?: FinSyncLocale
  variant?: 'grid' | 'stacked' | 'horizontal' | 'metrics'
}

export function BalanceSummary({
  statement,
  locale = 'en-IN',
  variant = 'grid',
}: BalanceSummaryProps) {
  const totals = calculateTotals(statement.transactions)
  const netCashFlowPaise = totals.totalCreditsPaise - totals.totalDebitsPaise

  if (variant === 'metrics') {
    return (
      <Row style={{ gap: token('spacing.sm') }}>
        <MetricCard label="Income" value={`+${formatExportCurrency(totals.totalCreditsPaise, locale)}`} color={token('colors.primary')} />
        <MetricCard label="Expenses" value={`-${formatExportCurrency(totals.totalDebitsPaise, locale)}`} color={token('colors.debit')} />
        <MetricCard
          label="Net cash flow"
          value={`${netCashFlowPaise >= 0 ? '+' : ''}${formatExportCurrency(netCashFlowPaise, locale)}`}
          color={netCashFlowPaise >= 0 ? token('colors.primary') : token('colors.debit')}
        />
      </Row>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Row style={{ gap: 8 }}>
        <PdfSummaryCell label="Opening balance" value={formatExportCurrency(statement.openingBalancePaise, locale)} />
        <PdfSummaryCell label="Closing balance" value={formatExportCurrency(statement.closingBalancePaise, locale)} />
        <PdfSummaryCell label="Total credits" value={formatExportCurrency(totals.totalCreditsPaise, locale)} />
        <PdfSummaryCell label="Total debits" value={formatExportCurrency(totals.totalDebitsPaise, locale)} />
        <PdfSummaryCell label="Net cash flow" value={formatExportCurrency(netCashFlowPaise, locale)} />
      </Row>
    )
  }

  if (variant === 'stacked') {
    return (
      <Column style={{ gap: 12 }}>
        <Row style={{ gap: 12 }}>
          <Column style={{ flex: 1, gap: 6, padding: 16, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md') }}>
            <Text style={{ fontSize: 10, color: token('colors.muted') }}>Opening balance</Text>
            <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.openingBalancePaise, locale)}</Text>
          </Column>
          <Column style={{ flex: 1, gap: 6, padding: 16, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: token('radii.md') }}>
            <Text style={{ fontSize: 10, color: token('colors.muted') }}>Closing balance</Text>
            <Text style={{ fontSize: 17, fontWeight: 700 }}>{formatCurrency(statement.closingBalancePaise, locale)}</Text>
          </Column>
        </Row>
        <Row style={{ gap: 12 }}>
          <Column style={{ flex: 1, gap: 6, padding: 16, backgroundColor: token('colors.primarySoft'), borderRadius: token('radii.md') }}>
            <Text style={{ fontSize: 10, color: token('colors.primary') }}>Total credits</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: token('colors.primary') }}>{formatCurrency(totals.totalCreditsPaise, locale)}</Text>
          </Column>
          <Column style={{ flex: 1, gap: 6, padding: 16, backgroundColor: token('colors.debitSoft'), borderRadius: token('radii.md') }}>
            <Text style={{ fontSize: 10, color: token('colors.debit') }}>Total debits</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: token('colors.debit') }}>{formatCurrency(totals.totalDebitsPaise, locale)}</Text>
          </Column>
        </Row>
      </Column>
    )
  }

  return (
    <Column style={{ gap: 12 }}>
      <Row style={{ gap: 12 }}>
        <WebSummaryCard label="Opening balance" value={formatCurrency(statement.openingBalancePaise, locale)} />
        <WebSummaryCard label="Closing balance" value={formatCurrency(statement.closingBalancePaise, locale)} />
      </Row>
      <Row style={{ gap: 12 }}>
        <WebSummaryCard label="Credits" value={formatCurrency(totals.totalCreditsPaise, locale)} />
        <WebSummaryCard label="Debits" value={formatCurrency(totals.totalDebitsPaise, locale)} />
      </Row>
    </Column>
  )
}

function WebSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Column style={{ flex: 1, gap: 4, padding: 14, border: { width: 1, style: 'solid', color: token('colors.line') }, borderRadius: 8 }}>
      <Text style={{ color: token('colors.muted'), fontSize: 10 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: 700 }}>{value}</Text>
    </Column>
  )
}

function PdfSummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <Column
      style={{
        flex: 1,
        gap: 3,
        padding: 8,
        border: { width: 1, style: 'solid', color: token('colors.line') },
        borderRadius: token('radii.sm'),
        backgroundColor: token('colors.surfaceSubtle'),
      }}
    >
      <Text style={{ fontSize: 8, color: token('colors.muted'), fontWeight: 700, letterSpacing: 0.3 }}>{label}</Text>
      <Text style={{ fontSize: 10, fontWeight: 700 }}>{value}</Text>
    </Column>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string | ReturnType<typeof token> }) {
  return (
    <Column
      style={{
        flex: 1,
        gap: token('spacing.xs'),
        padding: token('spacing.md'),
        backgroundColor: token('colors.surface'),
        border: { width: 1, style: 'solid', color: token('colors.line') },
        borderRadius: token('radii.md'),
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: 700, ...(color ? { color } : {}) }}>{value}</Text>
    </Column>
  )
}
