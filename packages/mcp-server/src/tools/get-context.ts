import { z } from 'zod';
import { authenticatedFetch } from '../auth';

export const getContextSchema = z.object({
  topic: z.string().describe('The topic to retrieve comprehensive context for'),
});

export type GetContextInput = z.infer<typeof getContextSchema>;

export const getContextDescription =
  'Get comprehensive organizational context about a topic from TribeMem. Returns facts, processes, decisions, and related entities.';

export async function getContext(input: GetContextInput): Promise<string> {
  const response = await authenticatedFetch('/v1/query', {
    method: 'POST',
    body: JSON.stringify({
      query: `Tell me everything our organization knows about: ${input.topic}`,
      max_results: 20,
      include_related: true,
    }),
  });

  const data = await response.json();

  const lines: string[] = [];
  lines.push(`## Context: ${input.topic}\n`);
  lines.push(data.answer);
  lines.push(`\n**Confidence:** ${Math.round(data.confidence * 100)}%`);

  if (data.sources && data.sources.length > 0) {
    // Group sources by type where possible
    const grouped: Record<string, typeof data.sources> = {};
    for (const source of data.sources) {
      const key = 'Knowledge';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(source);
    }

    for (const [group, sources] of Object.entries(grouped)) {
      lines.push(`\n### ${group}\n`);
      for (const source of sources) {
        lines.push(`- **${source.title}** (relevance: ${Math.round(source.relevance_score * 100)}%)`);
        lines.push(`  ${source.content_snippet}`);
      }
    }
  }

  if (data.related_questions && data.related_questions.length > 0) {
    lines.push('\n### Follow-up Questions\n');
    for (const question of data.related_questions) {
      lines.push(`- ${question}`);
    }
  }

  return lines.join('\n');
}
