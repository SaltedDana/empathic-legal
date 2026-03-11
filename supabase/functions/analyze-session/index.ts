import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Return existing analysis if already done
    const { data: existingAnalysis } = await supabaseClient
      .from("ai_analyses")
      .select("*")
      .eq("session_id", session_id)
      .single();

    if (existingAnalysis) {
      return new Response(JSON.stringify(existingAnalysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch session context
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("sessions")
      .select("context")
      .eq("id", session_id)
      .single();

    if (sessionError || !sessionData) {
      throw new Error(`Failed to fetch session: ${sessionError?.message}`);
    }

    // Fetch both party responses (service role bypasses RLS — this is intentional)
    const { data: responses, error: responsesError } = await supabaseClient
      .from("party_responses")
      .select("party_role, concerns, priorities, protections, desired_outcomes, submitted")
      .eq("session_id", session_id);

    if (responsesError || !responses || responses.length < 2) {
      throw new Error("Both party responses are required to generate analysis.");
    }

    if (!responses.every((r) => r.submitted)) {
      throw new Error("Both parties must submit before analysis can be generated.");
    }

    const partyA = responses.find((r) => r.party_role === "party_a");
    const partyB = responses.find((r) => r.party_role === "party_b");

    if (!partyA || !partyB) {
      throw new Error("Could not identify both parties in the session.");
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const prompt = `You are an expert mediator and empathic legal bridge-builder.

Analyze the following two-party negotiation and produce a response in the SAME LANGUAGE as the agreement context below. If the context is in Hebrew, respond entirely in Hebrew. If English, respond in English.

Agreement context:
${sessionData.context}

Party A shared the following privately:
- Concerns: ${partyA.concerns ?? "Not provided"}
- What they want protection from: ${partyA.protections ?? "Not provided"}
- Priorities: ${partyA.priorities ?? "Not provided"}
- Desired outcomes: ${partyA.desired_outcomes ?? "Not provided"}

Party B shared the following privately:
- Concerns: ${partyB.concerns ?? "Not provided"}
- What they want protection from: ${partyB.protections ?? "Not provided"}
- Priorities: ${partyB.priorities ?? "Not provided"}
- Desired outcomes: ${partyB.desired_outcomes ?? "Not provided"}

CRITICAL RULES:
1. NEVER quote either party directly or paraphrase in a way that could identify which words came from whom.
2. Translate all concerns into neutral, empathic language that validates both perspectives equally.
3. The summary must feel fair to both parties — neither should feel exposed or judged.
4. Legal concepts must be practical and relevant to the specific agreement described.
5. Bridge suggestions must be concrete, actionable, and constructive.

Respond with a JSON object in exactly this structure:
{
  "empathic_summary": "A cohesive 2-4 paragraph summary that acknowledges both sides' underlying needs and fears in neutral language.",
  "legal_concepts": [
    { "concept": "Name of legal concept", "explanation": "Why it is relevant and how it protects both parties" }
  ],
  "bridge_suggestions": [
    "Specific, actionable suggestion 1",
    "Specific, actionable suggestion 2"
  ]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: "You are a neutral mediator. You always respond with valid JSON matching the exact structure requested. You never take sides.",
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      throw new Error("Unexpected response type from Claude API.");
    }

    // Strip markdown code fences if present
    const jsonText = rawContent.text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const resultJson = JSON.parse(jsonText);

    if (!resultJson.empathic_summary || !resultJson.legal_concepts || !resultJson.bridge_suggestions) {
      throw new Error("AI response is missing required fields.");
    }

    // Save analysis
    const { data: newAnalysis, error: insertError } = await supabaseClient
      .from("ai_analyses")
      .insert({
        session_id,
        empathic_summary: resultJson.empathic_summary,
        legal_concepts: resultJson.legal_concepts,
        bridge_suggestions: resultJson.bridge_suggestions,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save analysis: ${insertError.message}`);
    }

    // Update session status
    await supabaseClient
      .from("sessions")
      .update({ status: "analyzed" })
      .eq("id", session_id);

    return new Response(JSON.stringify(newAnalysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("analyze-session error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
