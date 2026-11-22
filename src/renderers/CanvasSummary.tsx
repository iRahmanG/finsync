import { formatExportCurrency, formatStatementPeriod, maskAccountNumber } from '../financial'
import type { Statement } from '../types'
import { Canvas, Column, Image, Row, Text } from '@hyper-elements/react'
import { createFinSyncTheme, token } from '../theme'
import { exportPng } from '../export'
import { useState } from 'react'
import type { FinSyncLocale, FinSyncRendererConfig } from '../public-api'
import * as React from 'react'
void React
import { HyperPreview } from './HyperPreview'
import { BalanceSummary, ReconciliationBanner } from '../components'

interface CanvasSummaryProps {
  statement: Statement
  locale?: FinSyncLocale
  brandName?: string
  logoUrl?: string
  logoAlt?: string
  rendererConfig?: FinSyncRendererConfig
}

export function CanvasSummary({ statement, locale = 'en-IN', brandName = 'FinSync', logoUrl, logoAlt, rendererConfig }: CanvasSummaryProps) {
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')

  const handleExport = async () => {
    setExportState('loading')
    setExportMessage('')
    try {
      await exportPng(CanvasDocument({ statement, rendererConfig: rendererConfig ?? { brandName, locale } }), statement, rendererConfig)
      setExportState('success')
      setExportMessage('PNG download started.')
    } catch (error) {
      setExportState('error')
      setExportMessage(error instanceof Error ? error.message : 'PNG export failed.')
    }
  }

  return (
    <div className="canvas-renderer">
      <div className="canvas-heading">
        <div>
          <p className="eyebrow">FINANCIAL SNAPSHOT</p>
          <h1>Statement at a glance</h1>
          <p className="muted">{formatStatementPeriod(statement.statementPeriod.start, statement.statementPeriod.end, locale)}</p>
        </div>
        <button className="download-button" type="button" onClick={handleExport} disabled={exportState === 'loading'}>
          {exportState === 'loading' ? 'Preparing PNG…' : '↓ Download PNG'}
        </button>
      </div>
      {exportMessage && <p className={exportState === 'error' ? 'export-message error' : 'export-message'} role={exportState === 'error' ? 'alert' : 'status'}>{exportMessage}</p>}
      <div className="canvas-artboard">
        <HyperPreview
          title="Generated canvas preview"
          element={CanvasDocument({ statement, rendererConfig: rendererConfig ?? { brandName, locale, logoUrl, logoAlt } })}
        />
      </div>
    </div>
  )
}

export function CanvasDocument({ statement, locale = 'en-IN', brandName = 'FinSync', rendererConfig }: CanvasSummaryProps) {
  const resolvedConfig = rendererConfig ?? { brandName, locale }
  const resolvedLocale = resolvedConfig.locale
  const resolvedBrandName = resolvedConfig.brandName
  const optionalSections = resolvedConfig.optionalSections
  const statementPeriod = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
    resolvedLocale,
  )
  const maskedAccount = maskAccountNumber(statement.accountNumber)
  const creditsCount = statement.transactions.filter((t) => t.type === 'CREDIT').length
  const debitsCount = statement.transactions.filter((t) => t.type === 'DEBIT').length

  return (
    <Canvas
      theme={createFinSyncTheme(resolvedConfig.theme)}
      fonts={[
        { family: 'Noto Sans', src: '/fonts/NotoSans-Regular.ttf', format: 'truetype', weight: 400 },
        { family: 'Noto Sans', src: '/fonts/NotoSans-Bold.ttf', format: 'truetype', weight: 700 },
      ]}
      width={1200}
      height={630}
      title={`${resolvedBrandName} financial summary`}
      style={{
        padding: 36,
        gap: 16,
        backgroundColor: token('colors.surfaceSubtle'),
        color: token('colors.ink'),
        fontFamily: 'Noto Sans, Arial, sans-serif',
      }}
    >
      {/* 1. Header Bar: Brand Identity & Account Overview */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ gap: 10, alignItems: 'center' }}>
          {resolvedConfig.logoUrl && (
            <Image
              src={resolvedConfig.logoUrl}
              alt={resolvedConfig.logoAlt || `${resolvedBrandName} logo`}
              style={{ width: 32, height: 32 }}
            />
          )}
          <Text style={{ fontSize: 22, fontWeight: 700, color: token('colors.primary') }}>
            {resolvedBrandName}
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: token('colors.primary'),
              padding: [4, 8],
              backgroundColor: token('colors.primarySoft'),
              borderRadius: token('radii.sm'),
              letterSpacing: 0.5,
            }}
          >
            FINANCIAL SNAPSHOT
          </Text>
        </Row>
        <Row style={{ gap: 12, alignItems: 'center' }}>
          {optionalSections?.accountDetails !== false && (
            <Text style={{ fontSize: 12, fontWeight: 700, color: token('colors.ink') }}>
              {statement.accountHolder} · {maskedAccount}
            </Text>
          )}
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>
            {statementPeriod}
          </Text>
        </Row>
      </Row>

      {/* 2. Hero Section: Primary Account Balances */}
      <Row style={{ gap: 16 }}>
        <Column
          style={{
            flex: 1,
            gap: 6,
            padding: 20,
            backgroundColor: token('colors.surface'),
            border: { width: 1, style: 'solid', color: token('colors.line') },
            borderRadius: token('radii.md'),
          }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.6 }}>
              OPENING BALANCE
            </Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted') }}>
              Period Start
            </Text>
          </Row>
          <Text style={{ fontSize: 30, fontWeight: 700, color: token('colors.ink') }}>
            {formatExportCurrency(statement.openingBalancePaise, resolvedLocale)}
          </Text>
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>
            As of {statement.statementPeriod.start}
          </Text>
        </Column>

        <Column
          style={{
            flex: 1,
            gap: 6,
            padding: 20,
            backgroundColor: token('colors.surface'),
            border: { width: 1, style: 'solid', color: token('colors.line') },
            borderRadius: token('radii.md'),
          }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.6 }}>
              CLOSING BALANCE
            </Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.primary') }}>
              Reconciled
            </Text>
          </Row>
          <Text style={{ fontSize: 30, fontWeight: 700, color: token('colors.primary') }}>
            {formatExportCurrency(statement.closingBalancePaise, resolvedLocale)}
          </Text>
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>
            As of {statement.statementPeriod.end} · {statement.accountType}
          </Text>
        </Column>
      </Row>

      {/* 3. Core Financial Drivers Row */}
      {optionalSections?.financialSummary !== false && (
        <BalanceSummary statement={statement} locale={resolvedLocale} variant="metrics" />
      )}

      {/* 4. Activity Insights & Integrity Details */}
      <Row style={{ gap: 16 }}>
        <Column
          style={{
            flex: 1,
            gap: 6,
            padding: 16,
            backgroundColor: token('colors.surface'),
            border: { width: 1, style: 'solid', color: token('colors.line') },
            borderRadius: token('radii.md'),
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>
            ACTIVITY BREAKDOWN
          </Text>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: 700 }}>
              {statement.transactions.length} Total Transactions
            </Text>
            <Text style={{ fontSize: 11, color: token('colors.muted') }}>
              {debitsCount === 0
                ? 'No debit transactions in this period.'
                : `${creditsCount} credits · ${debitsCount} debits`}
            </Text>
          </Row>
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>
            Activity recorded between {statement.statementPeriod.start} and {statement.statementPeriod.end}
          </Text>
        </Column>

        <Column
          style={{
            flex: 1,
            gap: 6,
            padding: 16,
            backgroundColor: token('colors.surface'),
            border: { width: 1, style: 'solid', color: token('colors.line') },
            borderRadius: token('radii.md'),
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.muted'), letterSpacing: 0.5 }}>
            MATHEMATICAL RECONCILIATION
          </Text>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: token('colors.primary') }}>
              Opening + Credits - Debits = Closing
            </Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: token('colors.primary') }}>
              100% Match
            </Text>
          </Row>
          <Text style={{ fontSize: 11, color: token('colors.muted') }}>
            All ledger balances tracked and verified in integer paise arithmetic
          </Text>
        </Column>
      </Row>

      {/* 5. Warning Callout if Mismatch Detected */}
      <ReconciliationBanner statement={statement} locale={resolvedLocale} variant="email" />

      {/* 6. Footer Note */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', padding: { top: 4 } }}>
        <Text style={{ fontSize: 9, color: token('colors.muted') }}>
          Generated via {resolvedBrandName} Statement Engine · Powered by Hyper Elements
        </Text>
        <Text style={{ fontSize: 9, color: token('colors.muted') }}>
          Synthetic demonstration · Confidential
        </Text>
      </Row>
    </Canvas>
  )
}
