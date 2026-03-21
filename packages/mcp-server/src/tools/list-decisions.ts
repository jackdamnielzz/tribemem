import { z } from 'zod';
import { authenticatedFetch } from '../auth';

export const listDecisionsSchema = z.object({
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
    .describe('Optional category to filter decisions'),
  days: z
    .number()
    .int()
    .positive()
    .default(30)
    .describe('Number of days to look back (default: 30)'),
});

export type ListDecisionsInput = z.infer<typeof listDecisionsSchema>;

export const listDecisionsDescription =
  'List recent decisions recorded in TribeMem. Shows what was decided and why.';

export async function listDecisions(input: ListDecisionsInput): Promise<string> {
  const days = input.days ?? 30;
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const filters: Record<string, unknown> = {
    types: ['decision'],
    date_from: dateFrom,
  };

  if (input.category) {
    filters.categories = [input.category];
  }

  const response = await authenticatedFetch('/v1/query', {
    method: 'POST',
    body: JSON.stringify({
      query: `What decisions have been made recently${input.category ? ` in ${input.category}` : ''}?`,
      filters,
      max_results: 20,
    }),
  });

  const data = (await response.json()) as {
    answer: string;
    sources?: { title: string; content_snippet: string; confidence: number; last_confirmed_at?: string }[];
  };

  const lines: string[] = [];
  lines.push(`## Recent Decisions (last ${days} days)\n`);
  lines.push(data.answer);

  if (data.sources && data.sources.length > 0) {
    lines.push('\n## Decision Details\n');
    for (const source of data.sources) {
      lines.push(`### ${source.title}`);
      lines.push(source.content_snippet);
      lines.push(`- Confidence: ${source.confidence}`);
      if (source.last_confirmed_at) {
        lines.push(`- Last confirmed: ${new Date(source.last_confirmed_at).toLocaleDateString()}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
