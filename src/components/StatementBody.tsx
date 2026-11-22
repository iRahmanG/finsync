import * as React from 'react'
void React
import { Column } from '@hyper-elements/react'
import { AccountInformation } from './AccountInformation'
import { BalanceSummary } from './BalanceSummary'
import { TransactionSection } from './TransactionSection'
import type { Statement, Transaction } from '../types'
import type { FinSyncRendererConfig } from '../public-api'

export interface StatementBodyProps {
  statement: Statement
  transactions?: Transaction[]
  rendererConfig?: FinSyncRendererConfig
  variant?: 'web' | 'email' | 'pdf'
  balancesById?: Map<string, number>
}

export function StatementBody({
  statement,
  transactions = statement.transactions,
  rendererConfig,
  variant = 'web',
  balancesById,
}: StatementBodyProps) {
  const locale = rendererConfig?.locale ?? 'en-IN'
  const optionalSections = rendererConfig?.optionalSections
  const theme = rendererConfig?.theme

  const isEmail = variant === 'email'
  const isPdf = variant === 'pdf'

  return (
    <Column style={{ gap: isEmail ? 16 : 20 }}>
      {optionalSections?.accountDetails !== false && (
        <AccountInformation
          statement={statement}
          locale={locale}
          layout={isEmail ? 'column' : isPdf ? 'pdf' : 'row'}
          borderRadius={theme?.borderRadius ?? 9}
        />
      )}

      {optionalSections?.financialSummary !== false && (
        <BalanceSummary
          statement={statement}
          locale={locale}
          variant={isEmail ? 'stacked' : isPdf ? 'horizontal' : 'grid'}
        />
      )}

      {optionalSections?.transactions !== false && (
        <TransactionSection
          transactions={transactions}
          locale={locale}
          title={isEmail ? undefined : 'Transactions'}
          showReference={!isEmail}
          showType={!isEmail}
          showRunningBalance={isPdf}
          balancesById={balancesById}
          fallbackRunningBalance={statement.openingBalancePaise}
          cellPadding={isEmail ? [8, 5] : isPdf ? [10, 6] : [10, 7]}
          fontSize={isEmail ? 11 : isPdf ? 9 : undefined}
          useExportCurrency={isPdf}
          emptyMessage={
            isEmail
              ? 'No transactions were recorded for this statement period.'
              : 'No transactions match the current filters.'
          }
        />
      )}
    </Column>
  )
}
