import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const MODEL_HAIKU = 'claude-haiku-4-5-20251001';
const MODEL_SONNET = 'claude-sonnet-4-6';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// Simple rate limiter: track requests per minute
const rateLimitState = {
  requests: [] as number[],
  maxPerMinute: 50,
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;

  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }

  client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
}

/**
 * Wait if we are exceeding our self-imposed rate limit.
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  // Remove entries older than 60 seconds
  rateLimitState.requests = rateLimitState.requests.filter(
    (t) => now - t < 60_000,
  );

  if (rateLimitState.requests.length >= rateLimitState.maxPerMinute) {
    const oldest = rateLimitState.requests[0]!;
    const waitMs = 60_000 - (now - oldest) + 50;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  rateLimitState.requests.push(Date.now());
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await waitForRateLimit();
      return await fn();
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Anthropic.RateLimitError ||
        err instanceof Anthropic.InternalServerError ||
        err instanceof Anthropic.APIConnectionError;

      if (!isRetryable || attempt === retries) {
        throw err;
      }

      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[Anthropic] Retrying (attempt ${attempt + 1}/${retries}) after ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Unreachable, but satisfies the compiler
  throw new Error('Retry loop exhausted');
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Call Claude Haiku for fast, cheap operations (extraction, classification).
 */
export async function chatHaiku(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<string> {
  return callWithRetry(async () => {
    const response = await getClient().messages.create({
      model: MODEL_HAIKU,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0,
      system: options.system,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }
    return textBlock.text;
  });
}

/**
 * Call Claude Sonnet for nuanced reasoning (synthesis, contradiction detection).
 */
export async function chatSonnet(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<string> {
  return callWithRetry(async () => {
    const response = await getClient().messages.create({
      model: MODEL_SONNET,
      max_tokens: options.maxTokens ?? 8192,
      temperature: options.temperature ?? 0,
      system: options.system,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }
    return textBlock.text;
  });
}

/**
 * Parse a JSON response from the model, stripping markdown code fences if present.
 */
export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    cleaned = cleaned.slice(firstNewline + 1);
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3).trim();
    }
  }

  return JSON.parse(cleaned) as T;
}

/**
 * Estimate the number of tokens in a string.
 * Uses a simple heuristic: ~4 characters per token for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------------------------------------------------------------------------
// Token budget management
// ---------------------------------------------------------------------------

import {
  MODEL_CONTEXT_LIMITS,
  truncateToTokenBudget,
} from './tokens';

/**
 * Ensure content fits within a model's context window, reserving space for the
 * system prompt, response tokens, and overhead.
 */
function fitContentToBudget(
  content: string,
  model: 'haiku' | 'sonnet',
  reservedTokens: number = 2000,
): string {
  const limit = MODEL_CONTEXT_LIMITS[model];
  const budget = limit - reservedTokens;
  return truncateToTokenBudget(content, budget);
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Extract structured information from content using Claude Haiku.
 * Best for fast, cheap extraction and classification tasks.
 *
 * @param prompt - Instruction describing what to extract
 * @param content - The raw content to extract from
 * @returns The model's response text
 */
export async function extractWithHaiku(
  prompt: string,
  content: string,
): Promise<string> {
  const trimmedContent = fitContentToBudget(content, 'haiku');
  return chatHaiku(
    [{ role: 'user', content: `${prompt}\n\n---\n\n${trimmedContent}` }],
    { maxTokens: 4096, temperature: 0 },
  );
}

/**
 * Synthesize or reason over content using Claude Sonnet.
 * Best for nuanced reasoning, synthesis, and contradiction detection.
 *
 * @param prompt - Instruction describing what to synthesize
 * @param content - The content to reason over
 * @returns The model's response text
 */
export async function synthesizeWithSonnet(
  prompt: string,
  content: string,
): Promise<string> {
  const trimmedContent = fitContentToBudget(content, 'sonnet');
  return chatSonnet(
    [{ role: 'user', content: `${prompt}\n\n---\n\n${trimmedContent}` }],
    { maxTokens: 8192, temperature: 0 },
  );
}
