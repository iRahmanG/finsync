import { useEffect, useMemo, useRef } from 'react'
import { calculateTotals, formatCurrency } from '../financial'
import type { Statement } from '../types'

interface CanvasSummaryProps {
  statement: Statement
}

const categoryFor = (description: string) => {
  const value = description.toLowerCase()
  if (value.includes('rent')) return 'Housing'
  if (value.includes('grocery')) return 'Groceries'
  if (value.includes('electricity')) return 'Utilities'
  if (value.includes('restaurant')) return 'Dining'
  return 'Other'
}

export function CanvasSummary({ statement }: CanvasSummaryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const totals = calculateTotals(statement.transactions)
  const categories = useMemo(() => {
    const categoryTotals = new Map<string, number>()
    statement.transactions
      .filter(({ type }) => type === 'DEBIT')
      .forEach((transaction) => {
        const category = categoryFor(transaction.description)
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + transaction.amountPaise)
      })
    return [...categoryTotals.entries()].sort(([, first], [, second]) => second - first)
  }, [statement.transactions])
  const savingsPaise = totals.totalCreditsPaise - totals.totalDebitsPaise

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    const context = canvas.getContext('2d')
    if (!context) return
    context.scale(ratio, ratio)
    context.clearRect(0, 0, width, height)

    const colors = ['#2f7860', '#6fa98f', '#a8cbb9', '#d2e6dc', '#e9f4ef']
    const totalExpenses = Math.max(totals.totalDebitsPaise, 1)
    const centerX = 155
    const centerY = 184
    const radius = 105
    let startAngle = -Math.PI / 2
    categories.forEach(([, amount], index) => {
      const slice = (amount / totalExpenses) * Math.PI * 2
      context.beginPath()
      context.moveTo(centerX, centerY)
      context.arc(centerX, centerY, radius, startAngle, startAngle + slice)
      context.closePath()
      context.fillStyle = colors[index % colors.length]
      context.fill()
      startAngle += slice
    })
    context.beginPath()
    context.arc(centerX, centerY, 62, 0, Math.PI * 2)
    context.fillStyle = '#ffffff'
    context.fill()
    context.fillStyle = '#1b2b24'
    context.font = '600 16px "DM Sans", sans-serif'
    context.textAlign = 'center'
    context.fillText('Expenses', centerX, centerY - 2)
    context.fillStyle = '#78827c'
    context.font = '12px "DM Sans", sans-serif'
    context.fillText(formatCurrency(totals.totalDebitsPaise), centerX, centerY + 18)
  }, [categories, totals.totalDebitsPaise])

  return (
    <div className="canvas-renderer">
      <div className="canvas-heading">
        <div><p className="eyebrow">FINANCIAL SNAPSHOT</p><h1>June at a glance</h1><p className="muted">A visual summary of your monthly money flow.</p></div>
        <button className="download-button" type="button" onClick={() => window.print()}>↓ Save summary</button>
      </div>
      <div className="canvas-artboard">
        <div className="canvas-artboard-header"><div className="brand"><span className="brand-mark">F</span><span>finsync</span></div><span>JUNE 2024</span></div>
        <div className="canvas-metrics">
          <Metric label="Income" value={formatCurrency(totals.totalCreditsPaise)} kind="income" />
          <Metric label="Expenses" value={formatCurrency(totals.totalDebitsPaise)} kind="expense" />
          <Metric label="Saved" value={formatCurrency(savingsPaise)} kind="saved" />
        </div>
        <div className="canvas-chart">
          <canvas ref={canvasRef} aria-label={`Spending breakdown totaling ${formatCurrency(totals.totalDebitsPaise)}`} />
          <div className="category-list"><h2>Spending breakdown</h2>{categories.map(([category, amount], index) => <CategoryRow key={category} category={category} amountPaise={amount} totalPaise={totals.totalDebitsPaise} index={index} />)}</div>
        </div>
        <div className="canvas-insight"><span aria-hidden="true">✦</span><p><strong>Nice progress, {statement.accountHolder.split(' ')[0]}.</strong> You saved {formatCurrency(savingsPaise)} this month.</p></div>
      </div>
    </div>
  )
}

function Metric({ label, value, kind }: { label: string; value: string; kind: 'income' | 'expense' | 'saved' }) {
  return <div className={`canvas-metric ${kind}`}><span>{label}</span><strong>{value}</strong></div>
}

function CategoryRow({ category, amountPaise, totalPaise, index }: { category: string; amountPaise: number; totalPaise: number; index: number }) {
  const percentage = Math.round((amountPaise / totalPaise) * 100)
  return <div className="category-row"><div><span className={`category-dot category-${index}`} /><strong>{category}</strong><span>{percentage}%</span></div><div className="category-bar"><i style={{ width: `${percentage}%` }} /></div><small>{formatCurrency(amountPaise)}</small></div>
}
