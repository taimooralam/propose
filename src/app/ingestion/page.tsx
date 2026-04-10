'use client'

import { useState, useEffect } from 'react'

interface SeedProduct {
  title: string
  description: string
  price_cents: number
  currency: string
  category: string
  subtype: string
}

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
  price_model?: string
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
  seedProducts: SeedProduct[]
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

function EnrichmentField({ label, value, isNew }: { label: string; value: string | undefined; isNew: boolean }) {
  if (!value || value === '' || value === '[]') return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-zinc-500 w-24 shrink-0">{label}:</span>
      <span className={`text-xs ${isNew ? 'text-green-700 dark:text-green-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}>
        {isNew && <span className="text-green-500 mr-1">+</span>}
        {value}
      </span>
    </div>
  )
}

function ProductRow({ product, seed }: { product: CatalogProduct; seed?: SeedProduct }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
      >
        <td className="px-3 py-2 font-mono text-xs">{product.product_id}</td>
        <td className="px-3 py-2">
          <div className="font-medium">{product.title}</div>
          <div className="text-xs text-zinc-500 line-clamp-1">{product.description}</div>
        </td>
        <td className="px-3 py-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[product.category] ?? 'bg-zinc-100'}`}>
            {product.category}
          </span>
          {product.subtype && <span className="text-xs text-zinc-500 ml-1">{product.subtype}</span>}
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs">{product.capacity_min}-{product.capacity_max}</td>
        <td className="px-3 py-2 text-xs">{product.unit}</td>
        <td className="px-3 py-2 text-xs text-zinc-500">{product.tags.slice(0, 3).join(', ')}{product.tags.length > 3 ? '...' : ''}</td>
        <td className="px-3 py-2 text-xs">
          <span className="text-zinc-400">{expanded ? '▼' : '▶'}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="border-t border-zinc-50 dark:border-zinc-900">
          <td colSpan={7} className="px-3 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Raw Seed Data */}
              <div className="p-3 bg-zinc-50 rounded-lg dark:bg-zinc-900">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Raw Seed Data</h4>
                {seed ? (
                  <div className="space-y-1">
                    <EnrichmentField label="title" value={seed.title} isNew={false} />
                    <EnrichmentField label="description" value={seed.description} isNew={false} />
                    <EnrichmentField label="price" value={`${seed.currency} ${(seed.price_cents / 100).toFixed(2)}`} isNew={false} />
                    <EnrichmentField label="category" value={seed.category} isNew={false} />
                    <EnrichmentField label="subtype" value={seed.subtype} isNew={false} />
                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-400 italic">No capacity, unit, tags, amenities, indoor/outdoor, or embeddings</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">Seed data not available</p>
                )}
              </div>

              {/* Enriched Product */}
              <div className="p-3 bg-green-50 rounded-lg dark:bg-green-950/30">
                <h4 className="text-xs font-semibold text-green-700 uppercase mb-2 dark:text-green-400">After Enrichment</h4>
                <div className="space-y-1">
                  <EnrichmentField label="title" value={product.title} isNew={false} />
                  <EnrichmentField label="category" value={product.category} isNew={false} />
                  <EnrichmentField label="subtype" value={product.subtype} isNew={false} />

                  {/* Pre-parsed (deterministic) */}
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-blue-600 mb-1 dark:text-blue-400">Stage 1: Deterministic Pre-Parse</p>
                    <EnrichmentField label="capacity" value={`${product.capacity_min}-${product.capacity_max}`} isNew={true} />
                    <EnrichmentField label="unit" value={product.unit} isNew={true} />
                    <EnrichmentField label="indoor/outdoor" value={product.indoor_outdoor} isNew={true} />
                  </div>

                  {/* LLM enriched */}
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-purple-600 mb-1 dark:text-purple-400">Stage 2: Sonnet Extraction</p>
                    <EnrichmentField label="tags" value={product.tags.join(', ')} isNew={true} />
                    <EnrichmentField label="amenities" value={product.amenities.join(', ')} isNew={true} />
                    {product.dietary_options.length > 0 && (
                      <EnrichmentField label="dietary" value={product.dietary_options.join(', ')} isNew={true} />
                    )}
                    {product.price_model && (
                      <EnrichmentField label="price_model" value={product.price_model} isNew={true} />
                    )}
                  </div>

                  {/* Computed */}
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-zinc-500 mb-1">Computed</p>
                    <EnrichmentField label="embedding" value="1536-dim vector (text-embedding-3-small)" isNew={true} />
                    {product.source_hash && (
                      <EnrichmentField label="source_hash" value={product.source_hash} isNew={true} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
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
          Click any row to see <strong>raw → enriched</strong> comparison.
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

      {/* Pipeline Legend */}
      <section className="mb-6 p-3 bg-zinc-50 rounded-lg dark:bg-zinc-900">
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Pipeline:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            Raw seed
          </span>
          <span className="text-zinc-300">→</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Pre-parse (capacity, unit, env)
          </span>
          <span className="text-zinc-300">→</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Sonnet (tags, amenities, dietary)
          </span>
          <span className="text-zinc-300">→</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Embed (1536-dim)
          </span>
        </div>
        {data.meta && (
          <div className="mt-2 text-xs text-zinc-500">
            Enrichment: <strong>{data.meta.enrichment_model}</strong> | Embeddings: <strong>{data.meta.embedding_model}</strong> | Generated: {new Date(data.meta.created_at).toLocaleString()}
          </div>
        )}
      </section>

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
        <h2 className="text-lg font-semibold mb-1">Enriched Products ({filtered.length})</h2>
        <p className="text-xs text-zinc-500 mb-3">Click a row to expand raw → enriched comparison</p>
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
                <th className="px-3 py-2 text-left font-medium w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const seed = data.seedProducts?.[p.product_id - 1]
                return <ProductRow key={p.product_id} product={p} seed={seed} />
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
