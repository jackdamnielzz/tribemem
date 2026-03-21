import { z } from 'zod';
import { authenticatedFetch } from '../auth';

export const queryKnowledgeSchema = z.object({
  query: z.string().describe('The natural-language question to ask TribeMem'),
  category: z
    .enum([
      'engineering',
      'support',
      'hr',
      'finance',
      'product',
      'operations',
      'sales',
      'general',
    ])
    .optional()
    .describe('Optional category to narrow the search scope'),
  time_scope: z
    .enum(['current', 'all_time'])
    .optional()
    .describe('Whether to limit results to current knowledge or include historical'),
});

export type QueryKnowledgeInput = z.infer<typeof queryKnowledgeSchema>;

export const queryKnowledgeDescription =
  'Search TribeMem for organizational knowledge. Returns an AI-synthesized answer with source references.';

export async function queryKnowledge(input: QueryKnowledgeInput): Promise<string> {
  const body: Record<string, unknown> = {
    query: input.query,
  };

  const filters: Record<string, unknown> = {};
  if (input.category) {
    filters.categories = [input.category];
  }
  if (input.time_scope === 'current') {
    filters.date_from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (Object.keys(filters).length > 0) {
    body.filters = filters;
  }

  const response = await authenticatedFetch('/v1/query', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    answer: string;
    confidence: number;
    sources?: { title: string; relevance_score: number; content_snippet: string }[];
    related_questions?: string[];
  };

  // Format the response for the LLM
  const lines: string[] = [];
  lines.push(`## Answer\n\n${data.answer}`);
  lines.push(`\n**Confidence:** ${Math.round(data.confidence * 100)}%`);

  if (data.sources && data.sources.length > 0) {
    lines.push('\n## Sources\n');
    for (const source of data.sources) {
      lines.push(`- **${source.title}** (relevance: ${Math.round(source.relevance_score * 100)}%)`);
      lines.push(`  ${source.content_snippet}`);
    }
  }

  if (data.related_questions && data.related_questions.length > 0) {
    lines.push('\n## Related Questions\n');
    for (const question of data.related_questions) {
      lines.push(`- ${question}`);
    }
  }

  return lines.join('\n');
}
