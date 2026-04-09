import type { SlotMatch } from '@/schemas'

interface MatchResultsProps {
  matches: SlotMatch[]
}

export function MatchResults({ matches }: MatchResultsProps) {
  return (
    <div className="space-y-3">
      {matches.map((match, i) => (
        <div
          key={i}
          className={`p-4 border rounded-lg ${
            match.covered
              ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30'
              : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${match.covered ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-sm">{match.slot.type}</span>
              <span className="text-xs text-zinc-500">{match.slot.context}</span>
              {match.relaxed && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded dark:bg-amber-900 dark:text-amber-300">
                  recovered via relaxation
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${match.covered ? 'text-green-600' : 'text-red-600'}`}>
              {match.covered ? `${match.candidates.length} match${match.candidates.length !== 1 ? 'es' : ''}` : 'gap'}
            </span>
          </div>

          {match.covered && match.candidates.length > 0 ? (
            <div className="space-y-1 ml-4">
              {match.candidates.map((c, j) => (
                <div key={j} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {j === 0 ? '→ ' : '  '}{c.product.title}
                    <span className="text-xs text-zinc-500 ml-2">
                      {c.product.subtype} · cap {c.product.capacity_max}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {(c.similarity * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400 ml-4">
              {match.gap_reason}: {match.gap_detail}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
