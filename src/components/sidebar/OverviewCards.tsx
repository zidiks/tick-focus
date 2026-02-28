interface OverviewCardsProps {
  todayPomos: number
  todayFocusDuration: string
  totalPomos: number
  totalFocusDuration: string
}

const Card = ({ title, value }: { title: string; value: string | number }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/85 px-4 py-3">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-1 text-[2rem] font-semibold leading-none tracking-tight text-slate-900">{value}</p>
  </div>
)

export const OverviewCards = ({
  todayPomos,
  todayFocusDuration,
  totalPomos,
  totalFocusDuration,
}: OverviewCardsProps) => (
  <section className="space-y-4">
    <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Overview</h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card title="Today's Pomos" value={todayPomos} />
      <Card title="Today's Focus Duration" value={todayFocusDuration} />
      <Card title="Total Pomos" value={totalPomos} />
      <Card title="Total Focus Duration" value={totalFocusDuration} />
    </div>
  </section>
)
