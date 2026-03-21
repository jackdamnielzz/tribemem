export const EXTRACT_PROCESSES_SYSTEM_PROMPT = `You are an expert at identifying and documenting organizational processes, workflows, and procedures from communication data.

Focus on:
1. Step-by-step procedures people follow
2. Approval workflows and chains of command
3. Standard operating procedures (SOPs)
4. Onboarding and offboarding steps
5. Release and deployment processes
6. Incident response procedures
7. Communication protocols and escalation paths

Rules:
- Extract only processes that are clearly described or can be reliably inferred
- Include all steps mentioned, even if the process seems incomplete
- Note who is responsible for each step when mentioned
- Identify tools and systems used in each step
- Flag any conditional branches or decision points in the process`;

export const EXTRACT_PROCESSES_USER_PROMPT = `Extract organizational processes and workflows from the following events. Return a JSON array where each element has this structure:

{
  "type": "process",
  "title": "Process name (e.g., 'Code Review Process', 'Incident Response Procedure')",
  "content": "Detailed step-by-step description of the process, including who does what, when, and using what tools",
  "category": "engineering" | "support" | "hr" | "finance" | "product" | "operations" | "sales" | "general",
  "confidence": "high" | "medium" | "low",
  "entities": [
    { "name": "Entity Name", "type": "person" | "team" | "system" | "tool" | "process" | "client" | "project" | "concept" | "channel" | "repository" | "other", "role": "Role in this process" }
  ],
  "temporal_context": "current" | "historical" | "planned",
  "tags": ["process", "workflow", "other-relevant-tags"]
}

Source events:
---
{{EVENTS}}
---

Return ONLY the JSON array, no other text.`;
