'use client'

import { useState, useEffect } from 'react'

interface Stage {
  key: string
  label: string
  fastMs: number  // estimated time in fast mode
  fullMs: number  // estimated time in full mode
  fullOnly?: boolean
}

const STAGES: Stage[] = [
  { key: 'extracting', label: 'Extracting slots from RFP', fastMs: 2000, fullMs: 2000 },
  { key: 'matching', label: 'Matching products per slot', fastMs: 1000, fullMs: 1000 },
  { key: 'coverage', label: 'Checking coverage + gap recovery', fastMs: 500, fullMs: 500 },
  { key: 'assembling', label: 'Assembling proposal plan', fastMs: 300, fullMs: 300 },
  { key: 'generating', label: 'Generating block content (Sonnet)', fastMs: 0, fullMs: 15000, fullOnly: true },
  { key: 'api', label: 'Creating proposal via Proposales API', fastMs: 0, fullMs: 3000, fullOnly: true },
  { key: 'reviewing', label: 'Self-reviewing against RFP (Sonnet)', fastMs: 0, fullMs: 8000, fullOnly: true },
  { key: 'evaluating', label: 'Scoring quality + coherence', fastMs: 500, fullMs: 8000 },
]

interface ProgressIndicatorProps {
  running: boolean
  fullMode: boolean
}

export function ProgressIndicator({ running, fullMode }: ProgressIndicatorProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const visibleStages = fullMode ? STAGES : STAGES.filter(s => !s.fullOnly)

  useEffect(() => {
    if (!running) {
      setCurrentStage(0)
      setElapsed(0)
      return
    }

    const startTime = Date.now()

    const interval = setInterval(() => {
      const ms = Date.now() - startTime
      setElapsed(ms)

      // Advance stage based on cumulative timing
      let cumulative = 0
      for (let i = 0; i < visibleStages.length; i++) {
        cumulative += fullMode ? visibleStages[i].fullMs : visibleStages[i].fastMs
        if (ms < cumulative) {
          setCurrentStage(i)
          return
        }
      }
      setCurrentStage(visibleStages.length - 1)
    }, 200)

    return () => clearInterval(interval)
  }, [running, fullMode, visibleStages])

  if (!running) return null

  return (
    <div className="my-6 p-4 border border-blue-200 bg-blue-50 rounded-lg dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium text-sm text-blue-700 dark:text-blue-300">
          Pipeline running... {(elapsed / 1000).toFixed(0)}s
        </span>
      </div>
      <div className="space-y-1.5">
        {visibleStages.map((stage, i) => {
          const isDone = i < currentStage
          const isCurrent = i === currentStage
          return (
            <div key={stage.key} className="flex items-center gap-2 text-sm">
              {isDone ? (
                <span className="text-green-500 w-5 text-center">&#10003;</span>
              ) : isCurrent ? (
                <span className="w-5 text-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </span>
              ) : (
                <span className="text-zinc-300 w-5 text-center dark:text-zinc-600">&#9675;</span>
              )}
              <span className={
                isDone ? 'text-green-700 dark:text-green-400' :
                isCurrent ? 'text-blue-700 font-medium dark:text-blue-300' :
                'text-zinc-400 dark:text-zinc-600'
              }>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
