import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { EnrichedProduct } from '@/schemas'
import { z } from 'zod'

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json')

/** Load enriched catalog from disk. Returns empty array if file doesn't exist. */
export async function loadCatalog(): Promise<EnrichedProduct[]> {
  try {
    const raw = await readFile(CATALOG_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return z.array(EnrichedProduct).parse(parsed)
  } catch {
    return []
  }
}

/** Save enriched catalog to disk. */
export async function saveCatalog(products: EnrichedProduct[]): Promise<void> {
  const validated = z.array(EnrichedProduct).parse(products)
  await writeFile(CATALOG_PATH, JSON.stringify(validated, null, 2), 'utf-8')
}
