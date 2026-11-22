import * as React from 'react'
void React
import { Text } from '@hyper-elements/react'
import { token } from '../theme'
import { formatCurrency, getReconciliation } from '../financial'
import type { Statement } from '../types'
import type { FinSyncLocale } from '../public-api'

export interface ReconciliationBannerProps {
  statement: Statement
  locale?: FinSyncLocale
  variant?: 'standard' | 'compact' | 'email'
}

export function ReconciliationBanner({
  statement,
  locale = 'en-IN',
  variant = 'standard',
}: ReconciliationBannerProps) {
  const reconciliation = getReconciliation(statement)
  if (reconciliation.valid) return null

  const mismatch = reconciliation.differencePaise
  const direction = mismatch > 0 ? 'over' : 'under'
  const expectedFormatted = formatCurrency(reconciliation.expectedClosingBalancePaise, locale)
  const diffFormatted = formatCurrency(Math.abs(mismatch), locale)

  if (variant === 'compact') {
    return (
      <Text
        style={{
          padding: 8,
          border: { width: 1, style: 'solid', color: '#9A6700' },
          backgroundColor: token('colors.warningSoft'),
          color: token('colors.warning'),
          fontSize: 9,
          lineHeight: 1.4,
        }}
      >
        Statement needs review: calculated closing balance {expectedFormatted}; {direction} by {diffFormatted}.
      </Text>
    )
  }

  if (variant === 'email') {
    return (
      <Text
        style={{
          padding: 12,
          border: { width: 1, style: 'solid', color: token('colors.warning') },
          borderRadius: token('radii.sm'),
          color: token('colors.warning'),
          backgroundColor: token('colors.warningSoft'),
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        Statement needs review: the calculated closing balance is {expectedFormatted}, {direction} by {diffFormatted}.
      </Text>
    )
  }

  return (
    <Text
      style={{
        padding: 12,
        border: { width: 1, style: 'solid', color: token('colors.warning') },
        backgroundColor: token('colors.warningSoft'),
        color: token('colors.warning'),
        fontSize: 12,
      }}
    >
      Statement needs review: calculated closing balance is {expectedFormatted}.
    </Text>
  )
}
