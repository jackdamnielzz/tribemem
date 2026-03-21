export const EXTRACT_DECISIONS_SYSTEM_PROMPT = `You are an expert at identifying organizational decisions from communication data. Decisions are choices made by individuals or groups that affect how the organization operates.

Focus on:
1. Technical decisions (architecture choices, technology adoption, deprecations)
2. Product decisions (feature prioritization, roadmap changes, design choices)
3. Process changes (workflow updates, policy changes, new procedures)
4. People decisions (team structure changes, role assignments, hiring decisions)
5. Business decisions (pricing changes, partnership agreements, strategic pivots)

Rules:
- Each decision must clearly state WHAT was decided
- Include WHO made the decision when available
- Include WHY the decision was made (rationale) when available
- Include WHEN the decision was made or takes effect
- Note any alternatives that were considered and rejected
- Note any conditions or constraints on the decision
- Only extract decisions that are clearly stated or strongly implied, not speculative`;

export const EXTRACT_DECISIONS_USER_PROMPT = `Extract organizational decisions from the following events. Return a JSON array where each element has this structure:

{
  "type": "decision",
  "title": "Decision summary (e.g., 'Adopted PostgreSQL for the new analytics service')",
  "content": "Full description including: what was decided, who decided, why, when it takes effect, and any alternatives considered",
  "category": "engineering" | "support" | "hr" | "finance" | "product" | "operations" | "sales" | "general",
  "confidence": "high" | "medium" | "low",
  "entities": [
    { "name": "Entity Name", "type": "person" | "team" | "system" | "tool" | "process" | "client" | "project" | "concept" | "channel" | "repository" | "other", "role": "Role in this decision" }
  ],
  "temporal_context": "current" | "historical" | "planned",
  "tags": ["decision", "other-relevant-tags"]
}

Source events:
---
{{EVENTS}}
---

Return ONLY the JSON array, no other text.`;
