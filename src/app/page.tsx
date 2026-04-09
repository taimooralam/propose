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
    blocks: { slot: unknown; product: { title: string; price_cents?: number; currency: string }; quantity: number; unit_value_cents: number }[]
    gap_notes: string[]
  }
  evaluation: unknown
  meta: {
    latency_ms: number
    catalog_size: number
    slot_count: number
  }
}

export default function Home() {
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(rfp: string) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/run', {
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
        <h2 className="text-lg font-semibold mb-3">RFP Input</h2>
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

          {/* Proposal Plan */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Proposal Plan</h2>
            <div className="border border-zinc-200 rounded-lg overflow-hidden dark:border-zinc-700">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Slot</th>
                    <th className="px-4 py-2 text-left font-medium">Product</th>
                    <th className="px-4 py-2 text-right font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {result.plan.blocks.map((block, i) => (
                    <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-2">{(block.slot as { type: string }).type}</td>
                      <td className="px-4 py-2">{block.product.title}</td>
                      <td className="px-4 py-2 text-right">{block.quantity}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {block.product.currency} {(block.unit_value_cents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.plan.gap_notes.length > 0 && (
                <div className="px-4 py-2 bg-red-50 text-sm text-red-700 border-t dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                  <strong>Gaps:</strong> {result.plan.gap_notes.join(' · ')}
                </div>
              )}
            </div>
          </section>

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
