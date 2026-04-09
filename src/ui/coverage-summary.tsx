import type { CoverageReport } from '@/schemas'

interface CoverageSummaryProps {
  coverage: CoverageReport
}

export function CoverageSummary({ coverage }: CoverageSummaryProps) {
  const pct = Math.round(coverage.coverage_ratio * 100)
  const barColor = pct === 100
    ? 'bg-green-500'
    : pct >= 75
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div className="space-y-3">
      {/* Coverage bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Coverage</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {coverage.covered_slots}/{coverage.total_slots} required slots · {pct}%
          </span>
        </div>
        <div className="h-2 bg-zinc-200 rounded-full dark:bg-zinc-700">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Gaps */}
      {coverage.gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
            Gaps ({coverage.gaps.length})
          </h4>
          <ul className="space-y-1">
            {coverage.gaps.map((gap, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">×</span>
                <span>
                  {gap.slot_context}
                  <span className="text-xs text-zinc-500 ml-2">({gap.reason})</span>
                  {gap.detail && <span className="text-xs text-zinc-400 ml-1">— {gap.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
