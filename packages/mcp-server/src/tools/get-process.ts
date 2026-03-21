import { z } from 'zod';
import { authenticatedFetch } from '../auth';

export const getProcessSchema = z.object({
  process_name: z.string().describe('The name of the process to look up (e.g., "deploy to production", "onboarding")'),
});

export type GetProcessInput = z.infer<typeof getProcessSchema>;

export const getProcessDescription =
  'Look up a documented process by name in TribeMem. Returns step-by-step instructions.';

export async function getProcess(input: GetProcessInput): Promise<string> {
  const response = await authenticatedFetch('/v1/query', {
    method: 'POST',
    body: JSON.stringify({
      query: `How do we ${input.process_name}? Give me the step-by-step process.`,
      filters: {
        types: ['process'],
      },
      max_results: 5,
    }),
  });

  const data = (await response.json()) as {
    answer: string;
    confidence: number;
    sources?: { title: string; confidence: number; last_confirmed_at?: string }[];
  };

  const lines: string[] = [];
  lines.push(`## Process: ${input.process_name}\n`);
  lines.push(data.answer);
  lines.push(`\n**Confidence:** ${Math.round(data.confidence * 100)}%`);

  if (data.sources && data.sources.length > 0) {
    lines.push('\n## Source Documents\n');
    for (const source of data.sources) {
      lines.push(`- **${source.title}** (confidence: ${source.confidence})`);
      if (source.last_confirmed_at) {
        lines.push(`  Last confirmed: ${new Date(source.last_confirmed_at).toLocaleDateString()}`);
      }
    }
  }

  return lines.join('\n');
}
