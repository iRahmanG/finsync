import { Button, Divider, Email, Heading, Text, render } from '@hyper-elements/react'
import { createFinSyncTheme, token } from '../theme'
import type { FinSyncRendererConfig } from '../public-api'
import type { Statement } from '../types'
import { useEffect, useState } from 'react'
import React from 'react'
void React
import { BrandHeader, ReconciliationBanner, StatementBody } from '../components'

interface StatementEmailProps {
  statement: Statement
  statementUrl?: string
  rendererConfig?: FinSyncRendererConfig
}

const defaultRendererConfig: FinSyncRendererConfig = { brandName: 'FinSync', locale: 'en-IN' }

export function StatementEmailDocument({
  statement,
  statementUrl = '#statement',
  rendererConfig = defaultRendererConfig,
}: StatementEmailProps) {
  const { brandName, locale, theme } = rendererConfig
  const hyperTheme = createFinSyncTheme(theme)

  return (
    <Email
      theme={hyperTheme}
      fonts={[
        { family: 'FinSync Sans', src: '/fonts/FinSync-Regular.ttf', format: 'truetype', weight: 400 },
        { family: 'FinSync Sans', src: '/fonts/FinSync-Bold.ttf', format: 'truetype', weight: 700 },
      ]}
      width={580}
      previewText={`Your ${brandName} account statement is ready`}
      style={{
        gap: 16,
        backgroundColor: token('colors.surface'),
        color: token('colors.ink'),
        fontFamily: 'FinSync Sans, Arial, sans-serif',
      }}
    >
      <BrandHeader
        brandName={brandName}
        logoUrl={rendererConfig.logoUrl}
        logoAlt={rendererConfig.logoAlt}
        eyebrow="Monthly statement"
        variant="email"
      />
      <Heading level={1} style={{ fontSize: 30, lineHeight: 1.2, color: token('colors.ink') }}>
        Your account statement is ready
      </Heading>
      <Text style={{ color: token('colors.muted'), fontSize: 14, lineHeight: 1.6 }}>
        Hi {statement.accountHolder.split(' ')[0]}, your {statement.accountType.toLowerCase()} statement is ready to review.
      </Text>
      <StatementBody
        statement={statement}
        rendererConfig={rendererConfig}
        variant="email"
      />
      <ReconciliationBanner statement={statement} locale={locale} variant="email" />
      <Divider style={{ borderTop: { width: 1, style: 'solid', color: token('colors.line') } }} />
      <Button href={statementUrl} style={{ backgroundColor: token('colors.primary'), borderRadius: token('radii.sm'), padding: [12, 16] }}>
        View full statement
      </Button>
    </Email>
  )
}

export function StatementEmail({ statement, statementUrl = '#statement', rendererConfig }: StatementEmailProps) {
  const [html, setHtml] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    render(StatementEmailDocument({ statement, statementUrl, rendererConfig }))
      .then((result) => {
        if (active) {
          setError(undefined)
          setHtml(result.html)
        }
      })
      .catch((renderError: unknown) => {
        if (active) setError(renderError instanceof Error ? renderError.message : 'Email rendering failed.')
      })
    return () => { active = false }
  }, [rendererConfig, statement, statementUrl])

  if (error) return <p className="export-message error" role="alert">{error}</p>
  if (!html) return <p className="export-message" role="status">Preparing email preview…</p>
  return <iframe className="email-renderer-frame" title="Generated email preview" srcDoc={html} />
}
