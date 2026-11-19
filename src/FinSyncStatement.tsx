import { useMemo, useState, type CSSProperties } from 'react'
import './App.css'
import type { FinSyncStatementProps } from './public-api'
import type { Transaction } from './types'
import { validateStatement, formatCurrency, getReconciliation } from './financial'
import { maskAccountNumber } from './financial'
import {
  AccountDetails,
  MonthlyFinancialSummary,
  StatementHeader,
  TransactionTable,
} from './components'
import { PdfStatement, StatementEmail, CanvasSummary } from './renderers'

export function FinSyncStatement({
  statement,
  config,
  initialView = 'web',
  onInvalidStatement,
}: FinSyncStatementProps) {
  const [view, setView] = useState(initialView)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | Transaction['type']>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const validation = validateStatement(statement)

  if (!validation.valid) {
    onInvalidStatement?.(validation.errors)
  }

  const reconciliation = getReconciliation(statement)
  const brandName = config?.brandName?.trim() || 'FinSync'
  const statementForDisplay = {
    ...statement,
    accountNumber: maskAccountNumber(statement.accountNumber),
  }
  const themeOverrides = config?.theme
  const appStyle = {
    '--green': themeOverrides?.primaryColor,
    '--ink': themeOverrides?.textColor,
    '--muted': themeOverrides?.mutedColor,
    '--surface': themeOverrides?.surfaceColor,
    '--soft': themeOverrides?.subtleSurfaceColor,
    '--line': themeOverrides?.borderColor,
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
          <span className="brand-mark">{brandName[0]?.toUpperCase()}</span>
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
        <div className="profile">
          <span className="avatar">{profileInitials}</span>
          <span className="profile-name">{statement.accountHolder}</span>
        </div>
      </header>

      {view === 'canvas' ? (
        <main className="main-content canvas-page"><CanvasSummary statement={statementForDisplay} /></main>
      ) : view === 'pdf' ? (
        <main className="main-content pdf-page-container"><PdfStatement statement={statementForDisplay} onClose={() => setView('web')} /></main>
      ) : view === 'email' ? (
        <main className="main-content email-page"><StatementEmail statement={statementForDisplay} /></main>
      ) : (
        <main className="main-content" id="statement">
          <StatementHeader statement={statementForDisplay} onDownload={() => window.print()} />
          {!validation.valid && (
            <aside className="validation-banner" role="alert">
              <strong>Statement needs review</strong>
              <span>
                Calculated closing balance is {formatCurrency(reconciliation.expectedClosingBalancePaise)};
                {' '}supplied balance is {formatCurrency(statement.closingBalancePaise)}
                {' '}({reconciliation.differencePaise > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(reconciliation.differencePaise))}).
              </span>
            </aside>
          )}
          {optionalSections?.accountDetails !== false && <AccountDetails statement={statementForDisplay} />}
          {optionalSections?.financialSummary !== false && (
            <MonthlyFinancialSummary
              transactions={statement.transactions}
              openingBalancePaise={statement.openingBalancePaise}
              closingBalancePaise={statement.closingBalancePaise}
            />
          )}
          {optionalSections?.transactions !== false && (
            <section className="transactions-section">
              <div className="section-heading">
                <div><h2>Transactions</h2><p className="muted">{filteredTransactions.length} transactions in this statement</p></div>
                <div className="filters">
                  <label className="search-box">
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" />
                  </label>
                  <label className="date-filter"><span>From</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
                  <label className="date-filter"><span>To</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
                  <div className="filter-tabs" role="group" aria-label="Filter transactions">
                    {(['ALL', 'CREDIT', 'DEBIT'] as const).map((value) => (
                      <button className={filter === value ? 'selected' : ''} key={value} onClick={() => setFilter(value)} type="button">
                        {value === 'ALL' ? 'All' : value === 'CREDIT' ? 'Credits' : 'Debits'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <TransactionTable
                transactions={filteredTransactions}
                totalTransactions={statement.transactions.length}
                openingBalancePaise={statement.openingBalancePaise}
                allTransactions={statement.transactions}
              />
            </section>
          )}
        </main>
      )}
      <footer><span>© {statementYear} {brandName}</span><span>Synthetic statement template · Confidential</span></footer>
    </div>
  )
}
