import { useEffect, useState } from 'react'
import React from 'react'
void React
import { Page, Section, render } from '@hyper-elements/react'
import type { Statement, Transaction } from '../types'
import type { FinSyncRendererConfig } from '../public-api'
import { createFinSyncTheme, token } from '../theme'
import { formatStatementPeriod } from '../financial'
import { BrandHeader, ReconciliationBanner, StatementBody, StatementFooter } from '../components'

interface WebStatementProps {
  statement: Statement
  transactions: Transaction[]
  rendererConfig: FinSyncRendererConfig
}

export function StatementPageDocument({ statement, transactions, rendererConfig }: WebStatementProps) {
  const { brandName, locale, theme } = rendererConfig
  const period = formatStatementPeriod(
    statement.statementPeriod.start,
    statement.statementPeriod.end,
    locale,
  )

  return (
    <Page
      theme={createFinSyncTheme(theme)}
      fonts={[
        { family: 'FinSync Sans', src: '/fonts/FinSync-Regular.ttf', format: 'truetype', weight: 400 },
        { family: 'FinSync Sans', src: '/fonts/FinSync-Bold.ttf', format: 'truetype', weight: 700 },
      ]}
      style={{
        color: token('colors.ink'),
        fontFamily: "'DM Sans', 'Noto Sans', 'FinSync Sans', sans-serif",
        backgroundColor: token('colors.surface'),
      }}
    >
      <Section style={{ gap: 24, padding: 36 }}>
        <BrandHeader
          brandName={brandName}
          logoUrl={rendererConfig.logoUrl}
          logoAlt={rendererConfig.logoAlt}
          eyebrow="Personal finance"
          title="Account statement"
          period={period}
        />
        <ReconciliationBanner statement={statement} locale={locale} variant="standard" />
        <StatementBody
          statement={statement}
          transactions={transactions}
          rendererConfig={rendererConfig}
          variant="web"
        />
        <StatementFooter
          brandName={brandName}
          variant="web"
        />
      </Section>
    </Page>
  )
}

export function StatementPagePreview(props: WebStatementProps) {
  const [html, setHtml] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    render(StatementPageDocument(props))
      .then((result) => {
        if (active) {
          setError(undefined)
          setHtml(`<style>${result.bodyStyle}</style>${result.body}`)
        }
      })
      .catch((renderError: unknown) => {
        if (active) setError(renderError instanceof Error ? renderError.message : 'Web statement rendering failed.')
      })
    return () => { active = false }
  }, [props])

  if (error) return <p className="export-message error" role="alert">{error}</p>
  if (!html) return <p className="export-message" role="status">Preparing statement…</p>
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
