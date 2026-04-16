function DashboardAnalytics({ title, subtitle, bars = [], donut = null, metrics = [] }) {
  const maxBarValue = Math.max(...bars.map((item) => Number(item.value) || 0), 1)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Analytics view</p>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-zinc-600">{subtitle}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950">Volume by category</h3>
              <p className="text-sm text-zinc-600">Quick comparison of the main dashboard counts.</p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Bar chart
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {bars.map((item) => {
              const value = Number(item.value) || 0
              const width = Math.max((value / maxBarValue) * 100, value > 0 ? 8 : 0)
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-zinc-700">{item.label}</span>
                    <span className="font-semibold text-zinc-950">{item.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white">
                    <div
                      className={`h-3 rounded-full ${item.tone || 'bg-zinc-950'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  {item.note ? <p className="text-xs text-zinc-500">{item.note}</p> : null}
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950">Distribution</h3>
              <p className="text-sm text-zinc-600">A concise share view for the current role.</p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Donut chart
            </span>
          </div>

          {donut ? <DonutChart {...donut} /> : <EmptyChartState />}
        </section>
      </div>

      {metrics.length ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{item.value}</p>
              {item.description ? <p className="mt-2 text-sm text-zinc-600">{item.description}</p> : null}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}

function DonutChart({ segments = [], centerLabel, centerValue, footer }) {
  const total = Math.max(segments.reduce((sum, item) => sum + (Number(item.value) || 0), 0), 1)
  const size = 180
  const strokeWidth = 22
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="mt-6 space-y-5">
      <div className="mx-auto flex max-w-[260px] justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-52 w-52">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
          {segments.map((segment) => {
            const value = Number(segment.value) || 0
            const length = (value / total) * circumference
            const dashOffset = circumference - offset - length
            const rendered = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color || '#18181b'}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )
            offset += length
            return rendered
          })}
          <circle cx={size / 2} cy={size / 2} r={radius - 26} fill="white" />
          <text x="50%" y="48%" textAnchor="middle" className="fill-zinc-950 text-[18px] font-semibold">
            {centerValue}
          </text>
          <text x="50%" y="60%" textAnchor="middle" className="fill-zinc-500 text-[10px] uppercase tracking-[0.18em]">
            {centerLabel}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="size-3 rounded-full" style={{ backgroundColor: segment.color || '#18181b' }} />
              <span className="font-medium text-zinc-700">{segment.label}</span>
            </div>
            <span className="font-semibold text-zinc-950">{segment.value}</span>
          </div>
        ))}
      </div>

      {footer ? <p className="text-xs text-zinc-500">{footer}</p> : null}
    </div>
  )
}

function EmptyChartState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
      Chart data is not available yet.
    </div>
  )
}

export default DashboardAnalytics