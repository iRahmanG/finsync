import * as React from 'react'
void React
import { PageNumber, Row, Text } from '@hyper-elements/react'
import { token } from '../theme'

export interface StatementFooterProps {
  brandName: string
  showPageNumber?: boolean
  confidentialNotice?: string
  syntheticNotice?: string
  borderTop?: boolean
  variant?: 'standard' | 'pdf' | 'web'
}

export function StatementFooter({
  brandName,
  showPageNumber = false,
  confidentialNotice = 'Confidential',
  syntheticNotice = 'Synthetic demonstration',
  borderTop = false,
  variant = 'standard',
}: StatementFooterProps) {
  const hasBorderTop = borderTop || variant === 'web'

  return (
    <Row
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        ...(hasBorderTop
          ? {
              border: { top: { width: 1, style: 'solid', color: token('colors.line') } },
              padding: { top: 12 },
            }
          : {}),
      }}
    >
      <Text style={{ fontSize: 9, color: token('colors.muted') }}>
        {brandName} • {confidentialNotice}
      </Text>
      <Text style={{ fontSize: 9, color: token('colors.muted') }}>
        {syntheticNotice}
      </Text>
      {showPageNumber && (
        <Text style={{ fontSize: 9, color: token('colors.muted') }}>
          Page <PageNumber />
        </Text>
      )}
    </Row>
  )
}
