import { readFile, writeFile, rename } from 'fs/promises'
import path from 'path'
import { EnrichedProduct } from '@/schemas'
import { z } from 'zod'

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json')

/** Catalog metadata for versioning and consistency checks. */
export interface CatalogMeta {
  schema_version: string
  embedding_model: string
  enrichment_model: string
  created_at: string
  product_count: number
}

const CatalogFile = z.object({
  meta: z.object({
    schema_version: z.string(),
    embedding_model: z.string(),
    enrichment_model: z.string(),
    created_at: z.string(),
    product_count: z.number(),
  }),
  products: z.array(EnrichedProduct),
})

/** Load enriched catalog from disk. Returns empty array if file doesn't exist. */
export async function loadCatalog(): Promise<EnrichedProduct[]> {
  try {
    const raw = await readFile(CATALOG_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    const catalog = CatalogFile.parse(parsed)
    return catalog.products
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

/** Load catalog with metadata for versioning checks. */
export async function loadCatalogWithMeta(): Promise<{ meta: CatalogMeta; products: EnrichedProduct[] } | null> {
  try {
    const raw = await readFile(CATALOG_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return CatalogFile.parse(parsed)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

/** Save enriched catalog to disk using atomic write (temp file → rename).
 *  Prevents corrupt catalog if the process crashes mid-write. */
export async function saveCatalog(
  products: EnrichedProduct[],
  meta?: Partial<CatalogMeta>,
): Promise<void> {
  const validated = z.array(EnrichedProduct).parse(products)

  const catalogFile = {
    meta: {
      schema_version: meta?.schema_version ?? '1.0',
      embedding_model: meta?.embedding_model ?? 'text-embedding-3-small',
      enrichment_model: meta?.enrichment_model ?? 'claude-sonnet-4.6',
      created_at: meta?.created_at ?? new Date().toISOString(),
      product_count: validated.length,
    },
    products: validated,
  }

  const content = JSON.stringify(catalogFile, null, 2)
  const tmpPath = `${CATALOG_PATH}.tmp.${Date.now()}`

  // Atomic write: write to temp file, then rename (rename is atomic on most filesystems)
  await writeFile(tmpPath, content, 'utf-8')
  await rename(tmpPath, CATALOG_PATH)
}
