import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock external dependencies
// ---------------------------------------------------------------------------

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('../../lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
  insertSourceLink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../memory/vector', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  cosineSimilarity: vi.fn(),
}));

import { checkDuplicate } from '../../extraction/deduplicator';
import { insertSourceLink } from '../../lib/supabase';
import { generateEmbedding } from '../../memory/vector';

const mockedGenerateEmbedding = vi.mocked(generateEmbedding);
const mockedInsertSourceLink = vi.mocked(insertSourceLink);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

const sampleFact = {
  type: 'fact' as const,
  title: 'Deployments use Docker',
  content: 'All services are deployed via Docker containers.',
  category: 'engineering' as const,
  confidence: 'high' as const,
  entities: [],
  temporal_context: 'current' as const,
  tags: ['docker'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: null, error: null });
  });

  it('returns not duplicate when no matches are found', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const result = await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(result).toEqual({
      isDuplicate: false,
      existingId: null,
      similarity: 0,
    });
  });

  it('returns not duplicate when matches is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(result).toEqual({
      isDuplicate: false,
      existingId: null,
      similarity: 0,
    });
  });

  it('returns duplicate when similarity exceeds threshold', async () => {
    const matchId = 'existing-unit-id';
    mockRpc.mockResolvedValue({
      data: [{ id: matchId, similarity: 0.98 }],
      error: null,
    });

    const result = await checkDuplicate(ORG_ID, sampleFact, ['event-1', 'event-2']);

    expect(result).toEqual({
      isDuplicate: true,
      existingId: matchId,
      similarity: 0.98,
    });
  });

  it('merges sources when a duplicate is found', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'existing-id', similarity: 0.97 }],
      error: null,
    });

    await checkDuplicate(ORG_ID, sampleFact, ['event-1', 'event-2']);

    expect(mockedInsertSourceLink).toHaveBeenCalledTimes(2);
    expect(mockedInsertSourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        knowledge_unit_id: 'existing-id',
        raw_event_id: 'event-1',
      }),
    );
    expect(mockedInsertSourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        knowledge_unit_id: 'existing-id',
        raw_event_id: 'event-2',
      }),
    );
  });

  it('updates evidence count on duplicate', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'existing-id', similarity: 0.96 }],
      error: null,
    });

    await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(mockFrom).toHaveBeenCalledWith('knowledge_units');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'existing-id');
  });

  it('returns not duplicate when similarity is below threshold', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'some-id', similarity: 0.8 }],
      error: null,
    });

    const result = await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(result).toEqual({
      isDuplicate: false,
      existingId: null,
      similarity: 0.8,
    });
  });

  it('returns not duplicate when vector search fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    });

    const result = await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(result).toEqual({
      isDuplicate: false,
      existingId: null,
      similarity: 0,
    });
  });

  it('generates embedding from fact title and content', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(mockedGenerateEmbedding).toHaveBeenCalledWith(
      `${sampleFact.title}: ${sampleFact.content}`,
    );
  });

  it('passes the correct params to the RPC call', async () => {
    mockedGenerateEmbedding.mockResolvedValue([0.5, 0.6, 0.7] as never);
    mockRpc.mockResolvedValue({ data: [], error: null });

    await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(mockRpc).toHaveBeenCalledWith('match_knowledge_units', {
      query_embedding: [0.5, 0.6, 0.7],
      match_threshold: 0.95,
      match_count: 5,
      p_org_id: ORG_ID,
    });
  });

  it('does not merge sources when not a duplicate', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'some-id', similarity: 0.7 }],
      error: null,
    });

    await checkDuplicate(ORG_ID, sampleFact, ['event-1']);

    expect(mockedInsertSourceLink).not.toHaveBeenCalled();
  });
});
