import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the submission to analyze
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("*, assignments(title, subject)")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!submission.typed_content) {
      return new Response(
        JSON.stringify({ error: "No text content to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get other submissions for the same assignment to compare
    const { data: otherSubmissions } = await supabase
      .from("submissions")
      .select("id, typed_content, student_id")
      .eq("assignment_id", submission.assignment_id)
      .neq("id", submissionId)
      .not("typed_content", "is", null);

    // Build comparison context
    const comparisons = (otherSubmissions || [])
      .filter((s) => s.typed_content && s.typed_content.length > 50)
      .map((s, i) => `[Submission ${i + 1}]: ${s.typed_content?.substring(0, 1000)}`)
      .join("\n\n");

    const systemPrompt = `You are an academic integrity analyzer. Your job is to:
1. Analyze the submitted text for potential plagiarism
2. Compare it against other submissions for the same assignment
3. Look for copied phrases, similar sentence structures, or paraphrased content
4. Evaluate the originality of the work

Be fair and accurate. Consider that some similarity is expected for the same assignment topic.
Only flag genuine concerns where text appears to be copied or minimally paraphrased.`;

    const userPrompt = `Analyze this student submission for academic integrity:

**Assignment:** ${submission.assignments?.title || "Unknown"}
**Subject:** ${submission.assignments?.subject || "Unknown"}

**Submission to analyze:**
${submission.typed_content}

${comparisons ? `**Other submissions for comparison:**\n${comparisons}` : "No other submissions to compare against."}

Provide your analysis in the following JSON format:
{
  "similarity_percentage": <number 0-100>,
  "is_flagged": <boolean - true if similarity is concerning (above 40%)>,
  "matched_submissions": [<list of submission numbers that have high similarity>],
  "analysis_details": "<detailed explanation of findings, specific phrases that match, and overall assessment>"
}`;

    // Call Lovable AI with temperature 0 for consistent results
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        seed: 42,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let analysisResult;
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      analysisResult = {
        similarity_percentage: 0,
        is_flagged: false,
        matched_submissions: [],
        analysis_details: content || "Analysis completed but results could not be parsed.",
      };
    }

    // Get the auth user from the request
    const authHeader = req.headers.get("Authorization");
    let analyzedBy = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      analyzedBy = user?.id || null;
    }

    // Check if a report already exists
    const { data: existingReport } = await supabase
      .from("plagiarism_reports")
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    let reportResult;
    if (existingReport) {
      // Update existing report
      const { data, error } = await supabase
        .from("plagiarism_reports")
        .update({
          similarity_percentage: Math.min(100, Math.max(0, analysisResult.similarity_percentage || 0)),
          is_flagged: analysisResult.is_flagged || false,
          matched_submissions: analysisResult.matched_submissions || [],
          analysis_details: analysisResult.analysis_details || "",
          analyzed_at: new Date().toISOString(),
          analyzed_by: analyzedBy,
        })
        .eq("id", existingReport.id)
        .select()
        .single();

      if (error) throw error;
      reportResult = data;
    } else {
      // Create new report
      const { data, error } = await supabase
        .from("plagiarism_reports")
        .insert({
          submission_id: submissionId,
          similarity_percentage: Math.min(100, Math.max(0, analysisResult.similarity_percentage || 0)),
          is_flagged: analysisResult.is_flagged || false,
          matched_submissions: analysisResult.matched_submissions || [],
          analysis_details: analysisResult.analysis_details || "",
          analyzed_by: analyzedBy,
        })
        .select()
        .single();

      if (error) throw error;
      reportResult = data;
    }

    return new Response(
      JSON.stringify({ success: true, report: reportResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Plagiarism check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
