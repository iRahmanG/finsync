import { useMemo, useState } from 'react'
import './App.css'
import type { Transaction } from './types'
import { statement } from './data/statement'
import {
  AccountDetails,
  BalanceSummary,
  MonthlyFinancialSummary,
  StatementHeader,
  TransactionTable,
} from './components'
import { StatementEmail } from './renderers'

function App() {
  const [view, setView] = useState<'web' | 'email'>('web')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | Transaction['type']>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
          <a href="#insights">Insights</a>
          <a href="#settings">Settings</a>
        </nav>
        <div className="profile">
          <span className="avatar">AM</span>
          <span className="profile-name">Aarav Mehta</span>
          <button className="icon-button" aria-label="Open profile menu">⌄</button>
        </div>
      </header>

      {view === 'email' ? (
        <main className="main-content email-page" id="email">
          <StatementEmail statement={statement} />
        </main>
      ) : (
      <main className="main-content" id="statement">
        <StatementHeader statement={statement} onDownload={() => window.print()} />
        <AccountDetails statement={statement} />
        <BalanceSummary
          openingBalancePaise={statement.openingBalancePaise}
          closingBalancePaise={statement.closingBalancePaise}
          periodStart={statement.statementPeriod.start}
        />
        <MonthlyFinancialSummary
          transactions={statement.transactions}
          openingBalancePaise={statement.openingBalancePaise}
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
          />
        </section>
      </main>
      )}
      <footer><span>© 2024 FinSync</span><span>Securely managing your money, together.</span><a href="#support">Need help?</a></footer>
    </div>
  )
}

export default App
