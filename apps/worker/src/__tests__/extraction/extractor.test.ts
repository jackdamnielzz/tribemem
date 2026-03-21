import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock external dependencies before importing the module under test
// ---------------------------------------------------------------------------

vi.mock('../../lib/anthropic', () => ({
  chatHaiku: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

vi.mock('../../lib/tokens', () => ({
  estimateTokenCount: vi.fn((text: string) => Math.ceil(text.length / 4)),
  splitIntoChunks: vi.fn((text: string) => [text]),
}));

vi.mock('../../extraction/prompts/extract-facts', () => ({
  EXTRACT_FACTS_SYSTEM_PROMPT: 'system-facts',
  EXTRACT_FACTS_USER_PROMPT: 'Extract facts from: {{EVENTS}}',
}));

vi.mock('../../extraction/prompts/extract-processes', () => ({
  EXTRACT_PROCESSES_SYSTEM_PROMPT: 'system-processes',
  EXTRACT_PROCESSES_USER_PROMPT: 'Extract processes from: {{EVENTS}}',
}));

vi.mock('../../extraction/prompts/extract-decisions', () => ({
  EXTRACT_DECISIONS_SYSTEM_PROMPT: 'system-decisions',
  EXTRACT_DECISIONS_USER_PROMPT: 'Extract decisions from: {{EVENTS}}',
}));

import { extractFacts } from '../../extraction/extractor';
import { chatHaiku, parseJsonResponse } from '../../lib/anthropic';
import type { ConnectorType } from '@tribemem/shared';

const mockedChatHaiku = vi.mocked(chatHaiku);
const mockedParseJsonResponse = vi.mocked(parseJsonResponse);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawEvent(content: string, connectorType: ConnectorType = 'slack', occurredAt = '2024-01-15T10:00:00Z') {
  return {
    id: crypto.randomUUID(),
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    connector_id: 'conn-1',
    connector_type: connectorType,
    external_id: 'ext-1',
    event_type: 'message',
    author_external_id: null,
    author_name: null,
    content,
    raw_payload: {},
    occurred_at: occurredAt,
    ingested_at: '2024-01-15T10:01:00Z',
    processed: false,
    processed_at: null,
  };
}

const sampleFact = {
  type: 'fact',
  title: 'Deployments use Docker',
  content: 'All services are deployed via Docker containers.',
  category: 'engineering',
  confidence: 'high',
  entities: [{ name: 'Docker', type: 'tool', role: 'deployment tool' }],
  temporal_context: 'current',
  tags: ['docker', 'deployment'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('extractFacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty array when given no events', async () => {
    const result = await extractFacts([]);
    expect(result).toEqual([]);
    expect(mockedChatHaiku).not.toHaveBeenCalled();
  });

  it('calls chatHaiku three times per batch (facts, processes, decisions)', async () => {
    mockedChatHaiku.mockResolvedValue('[]');
    mockedParseJsonResponse.mockReturnValue([]);

    await extractFacts([makeRawEvent('We deployed to production.')]);

    // 3 extraction passes in parallel
    expect(mockedChatHaiku).toHaveBeenCalledTimes(3);
  });

  it('returns extracted facts from all three passes', async () => {
    const factResult = { ...sampleFact, type: 'fact' };
    const processResult = { ...sampleFact, type: 'process', title: 'CI/CD Pipeline' };
    const decisionResult = { ...sampleFact, type: 'decision', title: 'Use Kubernetes' };

    mockedChatHaiku.mockResolvedValue('mock-response');
    mockedParseJsonResponse
      .mockReturnValueOnce([factResult])
      .mockReturnValueOnce([processResult])
      .mockReturnValueOnce([decisionResult]);

    const events = [makeRawEvent('We decided to use Kubernetes for orchestration.')];
    const result = await extractFacts(events);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('fact');
    expect(result[1].type).toBe('process');
    expect(result[2].type).toBe('decision');
  });

  it('salvages individual valid facts when array validation fails', async () => {
    const validFact = { ...sampleFact };
    const invalidItem = { type: 'invalid-type', title: 123 }; // will fail validation

    mockedChatHaiku.mockResolvedValue('mock');
    mockedParseJsonResponse.mockReturnValue([validFact, invalidItem]);

    const events = [makeRawEvent('Some conversation content.')];
    const result = await extractFacts(events);

    // The valid fact should be salvaged even if the array validation fails
    // Due to the salvage logic, it should still return valid facts
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('continues processing when a chatHaiku call throws', async () => {
    mockedChatHaiku
      .mockRejectedValueOnce(new Error('API rate limited'))
      .mockResolvedValueOnce('[]')
      .mockResolvedValueOnce('[]');
    mockedParseJsonResponse.mockReturnValue([]);

    const events = [makeRawEvent('Some text')];
    // Should not throw; continues with other extraction passes
    const result = await extractFacts(events);
    expect(result).toEqual([]);
  });

  it('formats event text with connector type and timestamp', async () => {
    mockedChatHaiku.mockResolvedValue('[]');
    mockedParseJsonResponse.mockReturnValue([]);

    await extractFacts([
      makeRawEvent('Hello from Slack', 'slack', '2024-03-01T09:00:00Z'),
    ]);

    // Check the user prompt passed to chatHaiku contains the formatted event
    const firstCall = mockedChatHaiku.mock.calls[0];
    const userMessage = firstCall[0][0].content as string;
    expect(userMessage).toContain('[slack]');
    expect(userMessage).toContain('[2024-03-01T09:00:00Z]');
    expect(userMessage).toContain('Hello from Slack');
  });
});
