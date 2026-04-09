import type { EvalResult } from '@/schemas'

interface EvalScoresProps {
  evaluation: EvalResult
}

function ScoreTile({ label, value, description }: { label: string; value: number; description: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{pct}%</span>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  )
}

export function EvalScores({ evaluation }: EvalScoresProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScoreTile
          label={`Slot Recall @${evaluation.recall_k}`}
          value={evaluation.slot_recall}
          description="Required slots with valid candidates in top-K"
        />
        <ScoreTile
          label="Full Coverage"
          value={evaluation.full_coverage}
          description="Required slots with at least one match"
        />
        <ScoreTile
          label="Overall"
          value={evaluation.overall}
          description="Weighted aggregate score"
        />
      </div>

      {evaluation.flags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {evaluation.flags.map((flag, i) => (
            <span key={i} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-300">
              {flag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
