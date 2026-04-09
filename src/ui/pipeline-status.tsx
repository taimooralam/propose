const STAGES = [
  { key: 'extracting', label: 'Slot Extraction' },
  { key: 'matching', label: 'Product Matching' },
  { key: 'assembling', label: 'Proposal Assembly' },
  { key: 'evaluating', label: 'Evaluation' },
] as const

interface PipelineStatusProps {
  status: string
  latencyMs?: number
}

export function PipelineStatus({ status, latencyMs }: PipelineStatusProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STAGES.map(stage => {
        const isComplete = status === 'complete' || false
        return (
          <div
            key={stage.key}
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              isComplete
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {isComplete ? '✓' : '○'} {stage.label}
          </div>
        )
      })}
      {latencyMs !== undefined && (
        <span className="text-xs text-zinc-500 ml-auto">
          {(latencyMs / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  )
}
