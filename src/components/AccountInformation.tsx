import * as React from 'react'
void React
import { Column, Row, Text } from '@hyper-elements/react'
import { token } from '../theme'
import { formatStatementPeriod, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import type { FinSyncLocale } from '../public-api'

export interface AccountInformationProps {
  statement: Statement
  locale?: FinSyncLocale
  layout?: 'row' | 'column' | 'pdf'
  borderRadius?: number
}

export function AccountInformation({
  statement,
  locale = 'en-IN',
  layout = 'row',
  borderRadius = 9,
}: AccountInformationProps) {
  const period = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
    locale,
  )
  const maskedAccount = maskAccountNumber(statement.accountNumber)

  if (layout === 'column') {
    return (
      <Column
        style={{
          gap: 5,
          padding: 16,
          backgroundColor: token('colors.surfaceSubtle'),
          border: { width: 1, style: 'solid', color: token('colors.line') },
          borderRadius: token('radii.md'),
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>
          ACCOUNT
        </Text>
        <Text style={{ fontFamily: 'DM Mono, monospace', fontSize: 17 }}>
          {maskedAccount}
        </Text>
        <Text style={{ fontSize: 11, color: token('colors.muted') }}>
          {statement.accountHolder} · {period}
        </Text>
      </Column>
    )
  }

  if (layout === 'pdf') {
    return (
      <Row
        style={{
          gap: 12,
          padding: 10,
          border: { width: 1, style: 'solid', color: token('colors.line') },
          borderRadius: token('radii.sm'),
          backgroundColor: token('colors.surfaceSubtle'),
        }}
      >
        <Column style={{ flex: 1.3, gap: 3 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>ACCOUNT HOLDER</Text>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>{statement.accountHolder}</Text>
        </Column>
        <Column style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>ACCOUNT NUMBER</Text>
          <Text style={{ fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{maskedAccount}</Text>
        </Column>
        <Column style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>ACCOUNT TYPE</Text>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>{statement.accountType}</Text>
        </Column>
        <Column style={{ flex: 1.2, gap: 3 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>STATEMENT PERIOD</Text>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>{period}</Text>
        </Column>
      </Row>
    )
  }

  return (
    <Row
      style={{
        gap: 16,
        padding: 18,
        border: { width: 1, style: 'solid', color: token('colors.line') },
        borderRadius,
        backgroundColor: token('colors.surfaceSubtle'),
      }}
    >
      <Column style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.8 }}>
          ACCOUNT DETAILS
        </Text>
        <Text style={{ fontSize: 15, fontWeight: 700 }}>{statement.accountType}</Text>
        <Text style={{ color: token('colors.muted'), fontSize: 11 }}>
          {maskedAccount} · {statement.accountHolder}
        </Text>
      </Column>
      <Column style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.8 }}>
          STATEMENT PERIOD
        </Text>
        <Text style={{ fontSize: 13, fontWeight: 600 }}>{period}</Text>
      </Column>
    </Row>
  )
}
