import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // We need admin privileges to read both parties' responses
    );

    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabaseClient
      .from('ai_analyses')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (existingAnalysis) {
      return new Response(JSON.stringify(existingAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the session context
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('context')
      .eq('id', session_id)
      .single();

    if (sessionError || !sessionData) {
      throw new Error(`Failed to fetch session: ${sessionError?.message}`);
    }

    // Fetch party responses
    const { data: responses, error: responsesError } = await supabaseClient
      .from('party_responses')
      .select('*')
      .eq('session_id', session_id);

    if (responsesError || !responses || responses.length < 2) {
      throw new Error("Need both party responses to generate analysis.");
    }

    // Ensure both are submitted
    if (!responses.every(r => r.submitted)) {
      throw new Error("Both parties must submit before analysis.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `
      You are an expert mediator and legal bridge-builder.
      Your task is to analyze a two-party negotiation based on the following context and private responses.

      Context of agreement:
      ${sessionData.context}

      Party A:
      Concerns: ${responses[0].concerns}
      Priorities: ${responses[0].priorities}
      Protections wanted: ${responses[0].protections}
      Desired outcomes: ${responses[0].desired_outcomes}

      Party B:
      Concerns: ${responses[1].concerns}
      Priorities: ${responses[1].priorities}
      Protections wanted: ${responses[1].protections}
      Desired outcomes: ${responses[1].desired_outcomes}

      CRITICAL RULE: DO NOT quote either party directly. Translate all points into neutral, empathic language.

      Return the result strictly as a JSON object with the following structure:
      {
        "empathic_summary": "A cohesive summary that validates both perspectives.",
        "legal_concepts": [{"concept": "Name of legal concept", "explanation": "Why it helps"}],
        "bridge_suggestions": ["Suggestion 1", "Suggestion 2"]
      }
    `;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You output JSON matching the exact requested format." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", errText);
      throw new Error("Failed to generate analysis from AI.");
    }

    const aiData = await aiResponse.json();
    const resultJson = JSON.parse(aiData.choices[0].message.content);

    // Save to database
    const { data: newAnalysis, error: insertError } = await supabaseClient
      .from('ai_analyses')
      .insert({
        session_id: session_id,
        empathic_summary: resultJson.empathic_summary,
        legal_concepts: resultJson.legal_concepts,
        bridge_suggestions: resultJson.bridge_suggestions
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save analysis: ${insertError.message}`);
    }

    // Update session status
    await supabaseClient
      .from('sessions')
      .update({ status: 'analyzed' })
      .eq('id', session_id);

    return new Response(JSON.stringify(newAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
