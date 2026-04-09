import OpenAI from 'openai'
import { z } from 'zod'

// --- Model routing (OpenRouter naming) ---
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'
const SONNET_MODEL = 'anthropic/claude-sonnet-4.6'

// --- Direct SDK model IDs (Anthropic naming) ---
const HAIKU_MODEL_DIRECT = 'claude-haiku-4-5-20251001'
const SONNET_MODEL_DIRECT = 'claude-sonnet-4-6-20250514'

// --- Embedding (always OpenAI direct — OpenRouter doesn't serve embeddings) ---
const EMBEDDING_MODEL = 'text-embedding-3-small'

// --- Lazy-initialized clients ---
let _openrouter: OpenAI | null = null
let _anthropicDirect: OpenAI | null = null
let _openaiDirect: OpenAI | null = null

function hasOpenRouterKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY
}

/** OpenRouter client — single provider for all models in production. */
function getOpenRouter(): OpenAI {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })
  }
  return _openrouter
}

/** Direct Anthropic client via OpenAI-compatible endpoint (fallback for local dev). */
function getAnthropicDirect(): OpenAI {
  if (!_anthropicDirect) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY is required when OPENROUTER_API_KEY is not set')
    _anthropicDirect = new OpenAI({
      baseURL: 'https://api.anthropic.com/v1/',
      apiKey: key,
      defaultHeaders: { 'anthropic-version': '2023-06-01' },
    })
  }
  return _anthropicDirect
}

/** Direct OpenAI client (fallback for local dev). */
function getOpenAIDirect(): OpenAI {
  if (!_openaiDirect) {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error('OPENAI_API_KEY is required when OPENROUTER_API_KEY is not set')
    _openaiDirect = new OpenAI({
      apiKey: key,
    })
  }
  return _openaiDirect
}

/** Get the chat client and model ID based on available credentials. */
function getChatClientAndModel(openRouterModel: string, directModel: string): { client: OpenAI; model: string } {
  if (hasOpenRouterKey()) {
    return { client: getOpenRouter(), model: openRouterModel }
  }
  return { client: getAnthropicDirect(), model: directModel }
}

/** Get the embedding client — always OpenAI direct (OpenRouter doesn't serve embeddings). */
function getEmbeddingClient(): OpenAI {
  return getOpenAIDirect()
}

// --- Utilities ---

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Parse JSON from a model response. Tries full parse first, then regex fallback. */
function parseJsonResponse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error(`No JSON found in response: ${text.slice(0, 200)}`)
    }
    return JSON.parse(jsonMatch[0])
  }
}

/** Call a chat model with retry and exponential backoff. */
async function callChatWithRetry(
  openRouterModel: string,
  directModel: string,
  prompt: string,
  systemPrompt: string,
  maxRetries = 3,
): Promise<string> {
  const { client, model } = getChatClientAndModel(openRouterModel, directModel)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 4096,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      })

      return response.choices[0]?.message?.content ?? ''
    } catch (err) {
      if (attempt === maxRetries) throw err
      const delay = Math.pow(2, attempt) * 1000
      const provider = hasOpenRouterKey() ? 'OpenRouter' : 'direct'
      console.warn(`${provider} call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  throw new Error('Unreachable')
}

// --- Public API (function signatures unchanged) ---

/** Extract structured data from text using Haiku (fast, cheap — for per-request extraction). */
export async function extractStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string,
): Promise<T> {
  const text = await callChatWithRetry(
    HAIKU_MODEL,
    HAIKU_MODEL_DIRECT,
    prompt,
    systemPrompt ?? 'You are a precise data extraction assistant. Return only valid JSON matching the requested schema.',
  )

  const parsed = parseJsonResponse(text)
  return schema.parse(parsed)
}

/** Extract structured data using Sonnet (higher quality — for one-time enrichment). */
export async function extractStructuredSonnet<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string,
): Promise<T> {
  const text = await callChatWithRetry(
    SONNET_MODEL,
    SONNET_MODEL_DIRECT,
    prompt,
    systemPrompt ?? 'You are a precise data extraction assistant. Return only valid JSON matching the requested schema.',
  )

  const parsed = parseJsonResponse(text)
  return schema.parse(parsed)
}

/** Call OpenAI embeddings with retry. */
async function callEmbeddingWithRetry(
  input: string | string[],
  maxRetries = 3,
): Promise<OpenAI.Embeddings.CreateEmbeddingResponse> {
  const client = getEmbeddingClient()
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.embeddings.create({ model: EMBEDDING_MODEL, input })
    } catch (err) {
      if (attempt === maxRetries) throw err
      const delay = Math.pow(2, attempt) * 1000
      console.warn(`Embedding call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  throw new Error('Unreachable')
}

/** Embed a single text string. Returns a normalized vector.
 *  Always uses OpenAI directly — OpenRouter doesn't serve embedding models. */
export async function embedText(text: string): Promise<number[]> {
  const response = await callEmbeddingWithRetry(text)
  return response.data[0].embedding
}

/** Embed multiple texts in a single batch call. Returns vectors in the same order.
 *  Always uses OpenAI directly — OpenRouter doesn't serve embedding models. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await callEmbeddingWithRetry(texts)

  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding)
}
