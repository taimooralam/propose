'use client'

import { useState, useEffect } from 'react'

interface CatalogProduct {
  product_id: number
  title: string
  description: string
  category: string
  subtype?: string
  capacity_min: number
  capacity_max: number
  unit: string
  price_cents?: number
  currency: string
  tags: string[]
  amenities: string[]
  dietary_options: string[]
  indoor_outdoor: string
  source_hash?: string
}

interface CatalogData {
  meta: {
    schema_version: string
    embedding_model: string
    enrichment_model: string
    created_at: string
    product_count: number
  } | null
  productCount: number
  categoryCounts: Record<string, number>
  embeddingCoverage: number
  products: CatalogProduct[]
}

const CATEGORY_COLORS: Record<string, string> = {
  venue: 'bg-purple-100 text-purple-800',
  catering: 'bg-orange-100 text-orange-800',
  accommodation: 'bg-blue-100 text-blue-800',
  av_equipment: 'bg-cyan-100 text-cyan-800',
  activity: 'bg-green-100 text-green-800',
  decoration: 'bg-pink-100 text-pink-800',
  entertainment: 'bg-yellow-100 text-yellow-800',
  service: 'bg-gray-100 text-gray-800',
  dietary: 'bg-emerald-100 text-emerald-800',
}

export default function IngestionPage() {
  const [data, setData] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Failed to load catalog:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="max-w-5xl mx-auto px-4 py-8"><p>Loading catalog...</p></main>
  if (!data) return <main className="max-w-5xl mx-auto px-4 py-8"><p>Failed to load catalog.</p></main>

  const filtered = filter === 'all'
    ? data.products
    : data.products.filter(p => p.category === filter)

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Ingestion Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Enriched product catalog — two-stage pipeline: deterministic pre-parsing + Sonnet extraction.
        </p>
        <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">&larr; Back to RFP Analysis</a>
      </header>

      {/* Catalog Health */}
      {data.meta && (
        <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
            <p className="text-2xl font-bold">{data.productCount}</p>
            <p className="text-xs text-zinc-500">Products</p>
          </div>
          <div className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
            <p className="text-2xl font-bold">{Object.keys(data.categoryCounts).length}</p>
            <p className="text-xs text-zinc-500">Categories</p>
          </div>
          <div className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
            <p className="text-2xl font-bold">{Math.round(data.embeddingCoverage * 100)}%</p>
            <p className="text-xs text-zinc-500">Embedding Coverage</p>
          </div>
          <div className="p-4 border border-zinc-200 rounded-lg dark:border-zinc-700">
            <p className="text-sm font-mono">{data.meta.schema_version}</p>
            <p className="text-xs text-zinc-500">Schema Version</p>
          </div>
        </section>
      )}

      {/* Model Info */}
      {data.meta && (
        <section className="mb-6 p-3 bg-zinc-50 rounded-lg text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <span>Enrichment: <strong>{data.meta.enrichment_model}</strong></span>
          <span className="mx-3">|</span>
          <span>Embeddings: <strong>{data.meta.embedding_model}</strong></span>
          <span className="mx-3">|</span>
          <span>Generated: {new Date(data.meta.created_at).toLocaleString()}</span>
        </section>
      )}

      {/* Category Distribution */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Category Distribution</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}
          >
            All ({data.productCount})
          </button>
          {Object.entries(data.categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 text-sm rounded-full ${filter === cat ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : CATEGORY_COLORS[cat] ?? 'bg-zinc-100'}`}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      </section>

      {/* Product Table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Enriched Products ({filtered.length})</h2>
        <div className="border border-zinc-200 rounded-lg overflow-hidden dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-right font-medium">Capacity</th>
                <th className="px-3 py-2 text-left font-medium">Unit</th>
                <th className="px-3 py-2 text-left font-medium">Tags</th>
                <th className="px-3 py-2 text-left font-medium">Env</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.product_id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-3 py-2 font-mono text-xs">{p.product_id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-zinc-500 line-clamp-1">{p.description}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[p.category] ?? 'bg-zinc-100'}`}>
                      {p.category}
                    </span>
                    {p.subtype && <span className="text-xs text-zinc-500 ml-1">{p.subtype}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{p.capacity_min}-{p.capacity_max}</td>
                  <td className="px-3 py-2 text-xs">{p.unit}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{p.tags.slice(0, 3).join(', ')}{p.tags.length > 3 ? '...' : ''}</td>
                  <td className="px-3 py-2 text-xs">{p.indoor_outdoor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
