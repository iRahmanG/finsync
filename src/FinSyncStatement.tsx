import { useMemo, useState, type CSSProperties } from 'react'
import './App.css'
import type { FinSyncStatementProps } from './public-api'
import type { Transaction } from './types'
import { validateStatement } from './financial'
import { maskAccountNumber } from './financial'
import { PdfStatement, StatementEmail, CanvasSummary, StatementPagePreview } from './renderers'

export function FinSyncStatement({
  statement,
  config,
  initialView = 'web',
  onInvalidStatement,
  themePreset,
}: FinSyncStatementProps) {
  const [view, setView] = useState(initialView)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | Transaction['type']>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const validation = validateStatement(statement)
  if (config?.currency && config.currency !== 'INR') {
    onInvalidStatement?.(['Currency must be INR'])
  }

  if (!validation.valid) {
    onInvalidStatement?.(validation.errors)
  }

  const brandName = config?.brandName?.trim() || 'FinSync'
  const locale = config?.locale ?? 'en-IN'
  const statementForDisplay = {
    ...statement,
    accountNumber: maskAccountNumber(statement.accountNumber),
  }
  const themeOverrides = config?.theme
  const spacingScale = themeOverrides?.spacingScale ?? 1
  const radius = themeOverrides?.borderRadius ?? 9
  const appStyle = {
    '--green': themeOverrides?.primaryColor,
    '--ink': themeOverrides?.textColor,
    '--muted': themeOverrides?.mutedColor,
    '--surface': themeOverrides?.surfaceColor,
    '--soft': themeOverrides?.subtleSurfaceColor,
    '--line': themeOverrides?.borderColor,
    '--space-xs': `${4 * spacingScale}px`,
    '--space-sm': `${8 * spacingScale}px`,
    '--space-md': `${16 * spacingScale}px`,
    '--space-lg': `${24 * spacingScale}px`,
    '--space-xl': `${32 * spacingScale}px`,
    '--radius-sm': `${Math.max(2, radius - 3)}px`,
    '--radius-md': `${radius}px`,
  } as CSSProperties

  const profileInitials = statement.accountHolder
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const statementYear = statement.statementPeriod.end.slice(0, 4)

  const filteredTransactions = useMemo(
    () =>
      statement.transactions.filter((transaction) => {
        const matchesFilter = filter === 'ALL' || transaction.type === filter
        const searchText = `${transaction.description} ${transaction.reference}`.toLowerCase()
        const matchesDateFrom = !dateFrom || transaction.date >= dateFrom
        const matchesDateTo = !dateTo || transaction.date <= dateTo
        return matchesFilter && searchText.includes(query.toLowerCase()) && matchesDateFrom && matchesDateTo
      }).sort((first, second) =>
        first.date.localeCompare(second.date) ||
        first.id.localeCompare(second.id),
      ).reverse(),
    [dateFrom, dateTo, filter, query, statement.transactions],
  )

  const optionalSections = config?.optionalSections

  return (
    <div className="app-shell" style={appStyle}>
      <header className="topbar">
        <a className="brand" href="/" aria-label={`${brandName} home`}>
          {config?.logoUrl ? (
            <img
              className="brand-logo"
              src={config.logoUrl}
              alt={config.logoAlt || `${brandName} logo`}
              onError={(event) => { event.currentTarget.style.display = 'none' }}
            />
          ) : (
            <span className="brand-mark">{brandName[0]?.toUpperCase()}</span>
          )}
          <span>{brandName.toLowerCase()}</span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          {(['web', 'email', 'pdf', 'canvas'] as const).map((format) => (
            <button
              className={view === format ? 'nav-view active' : 'nav-view'}
              onClick={() => setView(format)}
              type="button"
              key={format}
            >
              {format === 'web' ? 'Statement' : format[0].toUpperCase() + format.slice(1)}
            </button>
          ))}
        </nav>
        {themePreset && (
          <label className="theme-preset no-print">
            <span>Theme</span>
            <select
              value={themePreset.value}
              onChange={(event) => themePreset.onChange(event.target.value)}
              aria-label="Theme preset"
            >
              {themePreset.options.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        )}
        <div className="profile">
          <span className="avatar">{profileInitials}</span>
          <span className="profile-name">{statement.accountHolder}</span>
        </div>
      </header>

      {view === 'canvas' ? (
        <main className="main-content canvas-page"><CanvasSummary statement={statementForDisplay} locale={locale} brandName={brandName} logoUrl={config?.logoUrl} logoAlt={config?.logoAlt} rendererConfig={{ brandName, locale, logoUrl: config?.logoUrl, logoAlt: config?.logoAlt, theme: themeOverrides, optionalSections }} /></main>
      ) : view === 'pdf' ? (
        <main className="main-content pdf-page-container"><PdfStatement statement={statementForDisplay} locale={locale} brandName={brandName} logoUrl={config?.logoUrl} logoAlt={config?.logoAlt} rendererConfig={{ brandName, locale, logoUrl: config?.logoUrl, logoAlt: config?.logoAlt, theme: themeOverrides, optionalSections }} onClose={() => setView('web')} /></main>
      ) : view === 'email' ? (
        <main className="main-content email-page">
          <StatementEmail
            statement={statementForDisplay}
            statementUrl="#statement"
            rendererConfig={{
              brandName,
              locale,
              logoUrl: config?.logoUrl,
              logoAlt: config?.logoAlt,
              theme: themeOverrides,
              optionalSections,
            }}
          />
        </main>
      ) : (
        <main className="main-content" id="statement">
          {optionalSections?.transactions !== false && (
            <div className="statement-toolbar no-print">
              <div className="toolbar-meta">
                <span className="toolbar-title">Filter Transactions</span>
                <span className="muted">Showing {filteredTransactions.length} of {statement.transactions.length} entries</span>
              </div>
              <div className="filters">
                <label className="search-box">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search description or reference…"
                    aria-label="Search transactions"
                  />
                </label>
                <label className="date-filter">
                  <span>From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    aria-label="Filter from date"
                  />
                </label>
                <label className="date-filter">
                  <span>To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    aria-label="Filter to date"
                  />
                </label>
                <div className="filter-tabs" role="group" aria-label="Filter transaction types">
                  {(['ALL', 'CREDIT', 'DEBIT'] as const).map((value) => (
                    <button
                      className={filter === value ? 'selected' : ''}
                      key={value}
                      onClick={() => setFilter(value)}
                      type="button"
                    >
                      {value === 'ALL' ? 'All' : value === 'CREDIT' ? 'Credits' : 'Debits'}
                    </button>
                  ))}
                </div>
                {(query || dateFrom || dateTo || filter !== 'ALL') && (
                  <button
                    className="reset-filters"
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setDateFrom('')
                      setDateTo('')
                      setFilter('ALL')
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="statement-sheet">
            <StatementPagePreview
              statement={statementForDisplay}
              transactions={filteredTransactions}
              rendererConfig={{
                brandName,
                locale,
                logoUrl: config?.logoUrl,
                logoAlt: config?.logoAlt,
                theme: themeOverrides,
                optionalSections,
              }}
            />
          </div>
        </main>
      )}
      <footer><span>© {statementYear} {brandName}</span><span>Synthetic statement template · Confidential</span></footer>
    </div>
  )
}
