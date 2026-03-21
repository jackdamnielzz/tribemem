/**
 * Token counting and content chunking utilities.
 *
 * Uses a simple word-based estimation since exact tokenization
 * requires the model's tokenizer. The ratio of ~0.75 tokens per word
 * is a reasonable approximation for English text with Claude models.
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimate the token count of a string.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Check if content fits within a given token budget.
 */
export function fitsWithinBudget(text: string, budget: number): boolean {
  return estimateTokenCount(text) <= budget;
}

/**
 * Split content into chunks that each fit within a token budget.
 * Chunks have configurable overlap to preserve context across boundaries.
 *
 * @param text - The text to split
 * @param maxTokens - Maximum tokens per chunk
 * @param overlapTokens - Number of tokens to overlap between chunks (default 100)
 * @returns Array of text chunks
 */
export function splitIntoChunks(
  text: string,
  maxTokens: number,
  overlapTokens: number = 100,
): string[] {
  if (fitsWithinBudget(text, maxTokens)) {
    return [text];
  }

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;
  const stepChars = maxChars - overlapChars;

  if (stepChars <= 0) {
    throw new Error('overlapTokens must be less than maxTokens');
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < text.length) {
    const end = Math.min(offset + maxChars, text.length);
    let chunk = text.slice(offset, end);

    // Try to break at a sentence or paragraph boundary
    if (end < text.length) {
      const lastParagraph = chunk.lastIndexOf('\n\n');
      const lastSentence = chunk.lastIndexOf('. ');
      const lastNewline = chunk.lastIndexOf('\n');

      const breakPoint =
        lastParagraph > maxChars * 0.5
          ? lastParagraph + 2
          : lastSentence > maxChars * 0.5
            ? lastSentence + 2
            : lastNewline > maxChars * 0.5
              ? lastNewline + 1
              : -1;

      if (breakPoint > 0) {
        chunk = chunk.slice(0, breakPoint);
      }
    }

    chunks.push(chunk.trim());
    offset += Math.max(chunk.length - overlapChars, 1);
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Truncate text to fit within a token budget, appending an ellipsis if truncated.
 */
export function truncateToTokenBudget(text: string, budget: number): string {
  if (fitsWithinBudget(text, budget)) return text;

  const maxChars = budget * CHARS_PER_TOKEN - 3; // reserve space for "..."
  const truncated = text.slice(0, maxChars);

  // Try to break at a word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}
