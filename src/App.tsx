import { useMemo, useState } from 'react'
import './App.css'
import type { Statement, Transaction } from './types'
import {
  AccountDetails,
  BalanceSummary,
  MonthlyFinancialSummary,
  StatementHeader,
  TransactionTable,
} from './components'

const statement: Statement = {
  accountHolder: 'Aarav Mehta',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 18245000,
  closingBalancePaise: 24787500,
  transactions: [
    { id: 'txn-01', date: '2024-06-28', description: 'Salary credit', reference: 'SAL/JUN/2024', type: 'CREDIT', amountPaise: 8500000 },
    { id: 'txn-02', date: '2024-06-26', description: 'Rent payment', reference: 'UPI/RENT/0624', type: 'DEBIT', amountPaise: 2800000 },
    { id: 'txn-03', date: '2024-06-24', description: 'Grocery shopping', reference: 'POS/DMART/9482', type: 'DEBIT', amountPaise: 328750 },
    { id: 'txn-04', date: '2024-06-21', description: 'Freelance payment', reference: 'NEFT/FRL/2189', type: 'CREDIT', amountPaise: 1250000 },
    { id: 'txn-05', date: '2024-06-18', description: 'Electricity bill', reference: 'BBPS/BESCOM/621', type: 'DEBIT', amountPaise: 164800 },
    { id: 'txn-06', date: '2024-06-15', description: 'Restaurant & dining', reference: 'CARD/FOOD/7731', type: 'DEBIT', amountPaise: 245600 },
    { id: 'txn-07', date: '2024-06-10', description: 'Cashback received', reference: 'CBK/AMZ/0601', type: 'CREDIT', amountPaise: 12500 },
  ],
}

function App() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | Transaction['type']>('ALL')

  const filteredTransactions = useMemo(
    () =>
      statement.transactions.filter((transaction) => {
        const matchesFilter = filter === 'ALL' || transaction.type === filter
        const searchText = `${transaction.description} ${transaction.reference}`.toLowerCase()
        return matchesFilter && searchText.includes(query.toLowerCase())
      }),
    [filter, query],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="FinSync home">
          <span className="brand-mark">F</span>
          <span>finsync</span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a className="active" href="#statement">Statement</a>
          <a href="#insights">Insights</a>
          <a href="#settings">Settings</a>
        </nav>
        <div className="profile">
          <span className="avatar">AM</span>
          <span className="profile-name">Aarav Mehta</span>
          <button className="icon-button" aria-label="Open profile menu">⌄</button>
        </div>
      </header>

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
      <footer><span>© 2024 FinSync</span><span>Securely managing your money, together.</span><a href="#support">Need help?</a></footer>
    </div>
  )
}

export default App
