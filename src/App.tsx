import { useMemo, useState } from 'react'
import './App.css'
import type { Transaction } from './types'
import { statement } from './data/statement'
import { calculateTotals, formatCurrency, validateStatement } from './financial'
import {
  AccountDetails,
  MonthlyFinancialSummary,
  StatementHeader,
  TransactionTable,
} from './components'
import { PdfStatement, StatementEmail } from './renderers'
import { CanvasSummary } from './renderers'

function App() {
  const [view, setView] = useState<'web' | 'email' | 'pdf' | 'canvas'>('web')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | Transaction['type']>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const validation = validateStatement(statement)
  const totals = calculateTotals(statement.transactions)
  const expectedClosingBalance =
    statement.openingBalancePaise + totals.totalCreditsPaise - totals.totalDebitsPaise
  const reconciliationDifference = statement.closingBalancePaise - expectedClosingBalance

  const filteredTransactions = useMemo(
    () =>
      statement.transactions.filter((transaction) => {
        const matchesFilter = filter === 'ALL' || transaction.type === filter
        const searchText = `${transaction.description} ${transaction.reference}`.toLowerCase()
        const matchesDateFrom = !dateFrom || transaction.date >= dateFrom
        const matchesDateTo = !dateTo || transaction.date <= dateTo
        return matchesFilter && searchText.includes(query.toLowerCase()) && matchesDateFrom && matchesDateTo
      }),
    [dateFrom, dateTo, filter, query],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="FinSync home">
          <span className="brand-mark">F</span>
          <span>finsync</span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <button className={view === 'web' ? 'nav-view active' : 'nav-view'} onClick={() => setView('web')} type="button">Statement</button>
          <button className={view === 'email' ? 'nav-view active' : 'nav-view'} onClick={() => setView('email')} type="button">Email</button>
          <button className={view === 'pdf' ? 'nav-view active' : 'nav-view'} onClick={() => setView('pdf')} type="button">PDF</button>
          <button className={view === 'canvas' ? 'nav-view active' : 'nav-view'} onClick={() => setView('canvas')} type="button">Canvas</button>
          <a href="#insights">Insights</a>
          <a href="#settings">Settings</a>
        </nav>
        <div className="profile">
          <span className="avatar">AM</span>
          <span className="profile-name">Aarav Mehta</span>
          <button className="icon-button" aria-label="Open profile menu">⌄</button>
        </div>
      </header>

      {view === 'canvas' ? (
        <main className="main-content canvas-page">
          <CanvasSummary statement={statement} />
        </main>
      ) : view === 'pdf' ? (
        <main className="main-content pdf-page-container">
          <PdfStatement statement={statement} onClose={() => setView('web')} />
        </main>
      ) : view === 'email' ? (
        <main className="main-content email-page" id="email">
          <StatementEmail statement={statement} />
        </main>
      ) : (
      <main className="main-content" id="statement">
        <StatementHeader statement={statement} onDownload={() => window.print()} />
        {!validation.valid && (
          <aside className="validation-banner" role="alert">
            <strong>Statement needs review</strong>
            <span>
              Calculated closing balance is {formatCurrency(expectedClosingBalance)};
              {' '}supplied balance is {formatCurrency(statement.closingBalancePaise)}
              {' '}({reconciliationDifference > 0 ? 'over' : 'under'} by {formatCurrency(Math.abs(reconciliationDifference))}).
            </span>
          </aside>
        )}
        <AccountDetails statement={statement} />
        <MonthlyFinancialSummary
          transactions={statement.transactions}
          openingBalancePaise={statement.openingBalancePaise}
          closingBalancePaise={statement.closingBalancePaise}
        />

        <section className="transactions-section">
          <div className="section-heading">
            <div><h2>Transactions</h2><p className="muted">{filteredTransactions.length} transactions in this statement</p></div>
            <div className="filters">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" />
              </label>
              <label className="date-filter">
                <span>From</span>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Filter from date" />
              </label>
              <label className="date-filter">
                <span>To</span>
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Filter to date" />
              </label>
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
      </main>
      )}
      <footer><span>© 2024 FinSync</span><span>Synthetic statement template · Confidential</span><a href="#support">Need help?</a></footer>
    </div>
  )
}

export default App
