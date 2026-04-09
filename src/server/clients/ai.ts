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
const EMBEDDING_MODEL = 'text-embedding-3-small'

/** Extract structured data from text using Haiku. Returns parsed output matching the schema. */
export async function extractStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string,
): Promise<T> {
  const response = await getAnthropic().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: systemPrompt ?? 'You are a precise data extraction assistant. Return only valid JSON matching the requested schema.',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('')

  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error(`No JSON found in Haiku response: ${text.slice(0, 200)}`)
  }

  const parsed = JSON.parse(jsonMatch[0])
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
