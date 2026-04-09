import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { z } from 'zod'

let _anthropic: Anthropic | null = null
let _openai: OpenAI | null = null

function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic()
  return _anthropic
}

function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI()
  return _openai
}

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const SONNET_MODEL = 'claude-sonnet-4-6-20250514'
const EMBEDDING_MODEL = 'text-embedding-3-small'

/** Sleep for a given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Parse JSON from a model response. Tries full parse first, then regex fallback. */
function parseJsonResponse(text: string): unknown {
  // Try parsing the full response as JSON first
  try {
    return JSON.parse(text)
  } catch {
    // Fallback: extract JSON from markdown or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error(`No JSON found in response: ${text.slice(0, 200)}`)
    }
    return JSON.parse(jsonMatch[0])
  }
}

/** Call Anthropic with retry and exponential backoff. */
async function callAnthropicWithRetry(
  model: string,
  prompt: string,
  systemPrompt: string,
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await getAnthropic().messages.create({
        model,
        max_tokens: 4096,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })

      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('')
    } catch (err) {
      if (attempt === maxRetries) throw err
      const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
      console.warn(`Anthropic call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  throw new Error('Unreachable')
}

/** Extract structured data from text using Haiku (fast, cheap — for per-request extraction). */
export async function extractStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string,
): Promise<T> {
  const text = await callAnthropicWithRetry(
    HAIKU_MODEL,
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
  const text = await callAnthropicWithRetry(
    SONNET_MODEL,
    prompt,
    systemPrompt ?? 'You are a precise data extraction assistant. Return only valid JSON matching the requested schema.',
  )

  const parsed = parseJsonResponse(text)
  return schema.parse(parsed)
}

/** Embed a single text string. Returns a normalized vector. */
export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })
  return response.data[0].embedding
}

/** Embed multiple texts in a single batch call. Returns vectors in the same order. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  })

  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding)
}
