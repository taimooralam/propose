'use client'

import { useState } from 'react'
import { RfpInput } from '@/ui/rfp-input'
import { PipelineStatus } from '@/ui/pipeline-status'
import { SlotCards } from '@/ui/slot-cards'
import { MatchResults } from '@/ui/match-results'
import { CoverageSummary } from '@/ui/coverage-summary'
import { EvalScores } from '@/ui/eval-scores'

interface PipelineResult {
  status: string
  slots: unknown[]
  coverage: {
    total_slots: number
    covered_slots: number
    coverage_ratio: number
    gaps: { slot_context: string; reason: string; detail?: string }[]
    matches: unknown[]
  }
  plan: {
    rfp_summary: string
    blocks: { slot: unknown; product: { title: string; price_cents?: number; currency: string }; content_md: string; quantity: number; unit_value_cents: number }[]
    gap_notes: string[]
  }
  review?: {
    summary: string
    findings: { severity: string; category: string; description: string }[]
    requirements_met: number
    overall_quality: string
  }
  proposal_uuid?: string
  proposal_url?: string
  evaluation: unknown
  meta: {
    latency_ms: number
    catalog_size: number
    slot_count: number
    blocks_generated?: number
    proposal_created?: boolean
  }
}

export default function Home() {
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fullMode, setFullMode] = useState(false)

  async function handleSubmit(rfp: string) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const endpoint = fullMode ? '/api/run?mode=full' : '/api/run'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rfp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Propose — AI Proposal Intelligence</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Slot-based retrieval for hotel event proposals. Paste an RFP to extract requirements, match products, and evaluate coverage.
        </p>
      </header>

      {/* Input Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">RFP Input</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fullMode}
              onChange={e => setFullMode(e.target.checked)}
              className="rounded"
              disabled={loading}
            />
            <span className="text-zinc-600 dark:text-zinc-400">
              Full pipeline <span className="text-xs">(Sonnet generation + review + coherence — slower)</span>
            </span>
          </label>
        </div>
        <RfpInput onSubmit={handleSubmit} loading={loading} />
      </section>

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Pipeline Status */}
          <section>
            <PipelineStatus status={result.status} latencyMs={result.meta.latency_ms} />
            <p className="text-xs text-zinc-500 mt-1">
              {result.meta.catalog_size} products · {result.meta.slot_count} slots extracted
            </p>
          </section>

          {/* Extracted Slots */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Extracted Slots</h2>
            <SlotCards slots={result.slots as never[]} />
          </section>

          {/* Per-Slot Matches */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Per-Slot Matching</h2>
            <MatchResults matches={result.coverage.matches as never[]} />
          </section>

          {/* Coverage Summary */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Coverage Report</h2>
            <CoverageSummary coverage={result.coverage as never} />
          </section>

          {/* Proposal */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Generated Proposal</h2>
              {result.proposal_url && (
                <a
                  href={result.proposal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  View in Proposales &rarr;
                </a>
              )}
            </div>
            {result.meta.proposal_created && (
              <p className="text-xs text-green-600 mb-3 dark:text-green-400">
                Proposal created via Proposales API (UUID: {result.proposal_uuid})
              </p>
            )}
            <div className="space-y-3">
              {result.plan.blocks.map((block, i) => (
                <div key={i} className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-zinc-100 rounded dark:bg-zinc-800">
                        {(block.slot as { type: string }).type}
                      </span>
                      <span className="font-medium text-sm">{block.product.title}</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">
                      {block.quantity} &times; {block.product.currency} {(block.unit_value_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {block.content_md}
                  </p>
                </div>
              ))}
            </div>
            {result.plan.gap_notes.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 text-sm text-red-700 rounded-lg border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                <strong>Gaps:</strong> {result.plan.gap_notes.join(' · ')}
              </div>
            )}
          </section>

          {/* Self-Review */}
          {result.review && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Self-Review</h2>
              <div className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    result.review.overall_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                    result.review.overall_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                    result.review.overall_quality === 'adequate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.review.overall_quality}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {Math.round(result.review.requirements_met * 100)}% requirements met
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">{result.review.summary}</p>
                {result.review.findings.length > 0 && (
                  <ul className="space-y-1">
                    {result.review.findings.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded ${
                          f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          f.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-zinc-100 text-zinc-600'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">{f.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {/* Evaluation Scores */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Evaluation</h2>
            <EvalScores evaluation={result.evaluation as never} />
          </section>
        </div>
      )}
    </main>
  )
}
