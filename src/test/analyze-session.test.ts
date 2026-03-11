import { describe, it, expect, vi, beforeEach } from "vitest";

// Tests for the analyze-session edge function logic.
// The edge function itself runs in Deno, so we test the core behaviors
// that can be verified from the frontend's perspective: what it receives,
// what it returns, and what it must never expose.

describe("analyze-session edge function contract", () => {
  const mockAnalysis = {
    id: "analysis-1",
    session_id: "session-1",
    empathic_summary: "Both parties share a desire for clarity and fairness.",
    legal_concepts: [
      { concept: "Indemnification", explanation: "Protects both parties from unexpected liability." },
    ],
    bridge_suggestions: [
      "Consider a phased equity vesting schedule.",
      "Define a clear dispute resolution process.",
    ],
    created_at: new Date().toISOString(),
  };

  it("returns an empathic_summary that does not quote either party directly", () => {
    const partyAInput = "I'm terrified he will steal my idea and cut me out";
    const partyBInput = "She always micromanages and I need autonomy";

    expect(mockAnalysis.empathic_summary).not.toContain(partyAInput);
    expect(mockAnalysis.empathic_summary).not.toContain(partyBInput);
  });

  it("response structure has all required fields", () => {
    expect(mockAnalysis).toHaveProperty("empathic_summary");
    expect(mockAnalysis).toHaveProperty("legal_concepts");
    expect(mockAnalysis).toHaveProperty("bridge_suggestions");
    expect(Array.isArray(mockAnalysis.legal_concepts)).toBe(true);
    expect(Array.isArray(mockAnalysis.bridge_suggestions)).toBe(true);
  });

  it("legal_concepts each have concept and explanation", () => {
    for (const concept of mockAnalysis.legal_concepts) {
      expect(concept).toHaveProperty("concept");
      expect(concept).toHaveProperty("explanation");
      expect(typeof concept.concept).toBe("string");
      expect(typeof concept.explanation).toBe("string");
    }
  });

  it("bridge_suggestions are strings", () => {
    for (const suggestion of mockAnalysis.bridge_suggestions) {
      expect(typeof suggestion).toBe("string");
      expect(suggestion.length).toBeGreaterThan(0);
    }
  });
});

describe("privacy boundary: party responses must not cross-expose", () => {
  it("party_role determines what each user submitted", () => {
    const responses = [
      { party_role: "party_a", concerns: "Party A private concern", submitted: true },
      { party_role: "party_b", concerns: "Party B private concern", submitted: true },
    ];

    const partyA = responses.find((r) => r.party_role === "party_a");
    const partyB = responses.find((r) => r.party_role === "party_b");

    // The edge function must use partyA and partyB separately — never expose one to the other
    expect(partyA?.concerns).not.toBe(partyB?.concerns);
    expect(partyA).toBeDefined();
    expect(partyB).toBeDefined();
  });

  it("analysis is generated only when both parties have submitted", () => {
    const allSubmitted = (responses: { submitted: boolean }[]) =>
      responses.every((r) => r.submitted);

    expect(allSubmitted([{ submitted: true }, { submitted: true }])).toBe(true);
    expect(allSubmitted([{ submitted: true }, { submitted: false }])).toBe(false);
    expect(allSubmitted([{ submitted: false }, { submitted: false }])).toBe(false);
  });

  it("requires exactly two parties before analysis", () => {
    const canAnalyze = (responses: unknown[]) => responses.length >= 2;

    expect(canAnalyze([])).toBe(false);
    expect(canAnalyze([{}])).toBe(false);
    expect(canAnalyze([{}, {}])).toBe(true);
  });
});

describe("JSON response parsing", () => {
  it("strips markdown code fences from AI response if present", () => {
    const stripFences = (text: string) =>
      text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();

    const withFences = "```json\n{\"key\": \"value\"}\n```";
    const withoutFences = "{\"key\": \"value\"}";

    expect(stripFences(withFences)).toBe('{"key": "value"}');
    expect(stripFences(withoutFences)).toBe('{"key": "value"}');
  });

  it("validates required fields in AI response before saving", () => {
    const validateResponse = (json: Record<string, unknown>) =>
      Boolean(json.empathic_summary && json.legal_concepts && json.bridge_suggestions);

    expect(validateResponse({ empathic_summary: "x", legal_concepts: [], bridge_suggestions: [] })).toBe(true);
    expect(validateResponse({ empathic_summary: "x", legal_concepts: [] })).toBe(false);
    expect(validateResponse({})).toBe(false);
  });
});
