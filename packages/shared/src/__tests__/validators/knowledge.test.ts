import { describe, it, expect } from 'vitest';
import {
  knowledgeTypeSchema,
  knowledgeCategorySchema,
  knowledgeStatusSchema,
  confidenceLevelSchema,
  temporalContextSchema,
  changeTypeSchema,
  entityTypeSchema,
  createKnowledgeUnitSchema,
  updateKnowledgeUnitSchema,
  extractedFactSchema,
  extractedEntitySchema,
} from '../../validators/knowledge';

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

describe('knowledgeTypeSchema', () => {
  it.each(['fact', 'process', 'decision', 'norm', 'definition'])(
    'accepts valid type "%s"',
    (type) => {
      expect(knowledgeTypeSchema.parse(type)).toBe(type);
    },
  );

  it('rejects an invalid type', () => {
    expect(() => knowledgeTypeSchema.parse('invalid')).toThrow();
  });
});

describe('knowledgeCategorySchema', () => {
  it.each(['engineering', 'support', 'hr', 'finance', 'product', 'operations', 'sales', 'general'])(
    'accepts valid category "%s"',
    (cat) => {
      expect(knowledgeCategorySchema.parse(cat)).toBe(cat);
    },
  );

  it('rejects an invalid category', () => {
    expect(() => knowledgeCategorySchema.parse('marketing')).toThrow();
  });
});

describe('knowledgeStatusSchema', () => {
  it.each(['active', 'superseded', 'contradicted', 'archived', 'flagged'])(
    'accepts valid status "%s"',
    (status) => {
      expect(knowledgeStatusSchema.parse(status)).toBe(status);
    },
  );
});

describe('confidenceLevelSchema', () => {
  it.each(['high', 'medium', 'low'])('accepts "%s"', (level) => {
    expect(confidenceLevelSchema.parse(level)).toBe(level);
  });
});

describe('temporalContextSchema', () => {
  it.each(['current', 'historical', 'planned'])('accepts "%s"', (ctx) => {
    expect(temporalContextSchema.parse(ctx)).toBe(ctx);
  });
});

describe('changeTypeSchema', () => {
  it.each(['created', 'updated', 'superseded', 'contradicted', 'confirmed', 'archived'])(
    'accepts "%s"',
    (ct) => {
      expect(changeTypeSchema.parse(ct)).toBe(ct);
    },
  );
});

describe('entityTypeSchema', () => {
  const validTypes = [
    'person', 'team', 'system', 'tool', 'process',
    'client', 'project', 'concept', 'channel', 'repository', 'other',
  ];

  it.each(validTypes)('accepts "%s"', (type) => {
    expect(entityTypeSchema.parse(type)).toBe(type);
  });
});

// ---------------------------------------------------------------------------
// createKnowledgeUnitSchema
// ---------------------------------------------------------------------------

describe('createKnowledgeUnitSchema', () => {
  const validInput = {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'fact' as const,
    category: 'engineering' as const,
    title: 'Deployment uses Docker',
    content: 'All services are deployed as Docker containers via CI/CD pipeline.',
    confidence_score: 0.9,
    valid_from: '2024-01-01T00:00:00Z',
    valid_until: null,
    status: 'active' as const,
    tags: ['docker', 'deployment'],
    metadata: {},
  };

  it('accepts a valid knowledge unit input', () => {
    const result = createKnowledgeUnitSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('applies default values for optional fields', () => {
    const result = createKnowledgeUnitSchema.parse(validInput);
    expect(result.evidence_count).toBe(1);
    expect(result.is_current).toBe(true);
    expect(result.superseded_by).toBeNull();
    expect(result.supersedes).toBeNull();
    expect(result.last_confirmed_at).toBeNull();
  });

  it('rejects missing required fields', () => {
    const result = createKnowledgeUnitSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createKnowledgeUnitSchema.safeParse({
      ...validInput,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence_score above 1', () => {
    const result = createKnowledgeUnitSchema.safeParse({
      ...validInput,
      confidence_score: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence_score below 0', () => {
    const result = createKnowledgeUnitSchema.safeParse({
      ...validInput,
      confidence_score: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects too many tags', () => {
    const result = createKnowledgeUnitSchema.safeParse({
      ...validInput,
      tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid org_id format', () => {
    const result = createKnowledgeUnitSchema.safeParse({
      ...validInput,
      org_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateKnowledgeUnitSchema
// ---------------------------------------------------------------------------

describe('updateKnowledgeUnitSchema', () => {
  it('accepts a partial update with just title', () => {
    const result = updateKnowledgeUnitSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (no fields updated)', () => {
    const result = updateKnowledgeUnitSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid confidence_score', () => {
    const result = updateKnowledgeUnitSchema.safeParse({ confidence_score: 2 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractedEntitySchema
// ---------------------------------------------------------------------------

describe('extractedEntitySchema', () => {
  it('accepts a valid entity', () => {
    const result = extractedEntitySchema.safeParse({
      name: 'Alice',
      type: 'person',
      role: 'lead engineer',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = extractedEntitySchema.safeParse({
      name: '',
      type: 'person',
      role: 'engineer',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractedFactSchema
// ---------------------------------------------------------------------------

describe('extractedFactSchema', () => {
  const validFact = {
    type: 'fact' as const,
    title: 'API uses REST',
    content: 'The public API follows REST conventions with JSON payloads.',
    category: 'engineering' as const,
    confidence: 'high' as const,
    entities: [
      { name: 'Public API', type: 'system' as const, role: 'subject' },
    ],
    temporal_context: 'current' as const,
    tags: ['api', 'rest'],
  };

  it('accepts a valid extracted fact', () => {
    const result = extractedFactSchema.safeParse(validFact);
    expect(result.success).toBe(true);
  });

  it('rejects missing content', () => {
    const { content, ...noContent } = validFact;
    const result = extractedFactSchema.safeParse(noContent);
    expect(result.success).toBe(false);
  });

  it('rejects invalid confidence level', () => {
    const result = extractedFactSchema.safeParse({
      ...validFact,
      confidence: 'very-high',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty entities array', () => {
    const result = extractedFactSchema.safeParse({
      ...validFact,
      entities: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects too many entities', () => {
    const result = extractedFactSchema.safeParse({
      ...validFact,
      entities: Array.from({ length: 21 }, (_, i) => ({
        name: `entity-${i}`,
        type: 'person',
        role: 'member',
      })),
    });
    expect(result.success).toBe(false);
  });
});
