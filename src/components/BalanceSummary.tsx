import { formatCurrency } from '../financial'

interface BalanceSummaryProps {
  openingBalancePaise: number
  closingBalancePaise: number
  periodStart: string
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export function BalanceSummary({
  openingBalancePaise,
  closingBalancePaise,
  periodStart,
}: BalanceSummaryProps) {
  return (
    <section className="balance-summary" aria-label="Opening and closing balance">
      <BalanceItem label="Opening balance" amountPaise={openingBalancePaise} detail={`As of ${formatDate(periodStart)}`} />
      <BalanceItem label="Closing balance" amountPaise={closingBalancePaise} detail="End of statement period" />
    </section>
  )
}

function BalanceItem({ label, amountPaise, detail }: { label: string; amountPaise: number; detail: string }) {
  return (
    <article className="balance-summary-item">
      <p className="card-label">{label}</p>
      <strong>{formatCurrency(amountPaise)}</strong>
      <span>{detail}</span>
    </article>
  )
}
