import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract text from different file types
async function extractTextFromFile(fileUrl: string): Promise<string | null> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error("Failed to fetch file:", response.status);
      return null;
    }

    const fileName = fileUrl.split('/').pop()?.toLowerCase() || '';
    
    // Handle .txt files
    if (fileName.endsWith('.txt')) {
      return await response.text();
    }
    
    // Handle .docx files
    if (fileName.endsWith('.docx')) {
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    // Handle .pdf files - basic extraction
    if (fileName.endsWith('.pdf')) {
      // PDF text extraction is limited in edge functions
      // Return a message indicating PDF support is limited
      return null;
    }
    
    // Handle .doc files (older format) - not supported
    if (fileName.endsWith('.doc')) {
      return null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submissionId } = await req.json();
    if (!submissionId) {
      return new Response(JSON.stringify({ error: "Submission ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is faculty/admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has faculty or admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || (roleData.role !== "faculty" && roleData.role !== "admin")) {
      return new Response(JSON.stringify({ error: "Unauthorized - Faculty or Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch submission with assignment details
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select(`
        *,
        assignments (
          title,
          description,
          subject,
          max_score
        )
      `)
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      console.error("Submission fetch error:", subError);
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assignment = submission.assignments;
    
    // Get content from typed content or extract from file
    let studentContent = submission.typed_content || "";
    
    if (!studentContent.trim() && submission.file_url) {
      console.log("Extracting text from file:", submission.file_url);
      const extractedText = await extractTextFromFile(submission.file_url);
      if (extractedText) {
        studentContent = extractedText;
      } else {
        const fileName = submission.file_url.split('/').pop()?.toLowerCase() || '';
        if (fileName.endsWith('.pdf')) {
          return new Response(JSON.stringify({ error: "PDF text extraction is not supported. Please ask the student to submit as .docx or typed text." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Could not extract text from the uploaded file. Supported formats: .txt, .docx" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!studentContent.trim()) {
      return new Response(JSON.stringify({ error: "No content to evaluate in this submission" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI for evaluation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert academic evaluator. Your job is to evaluate student assignment submissions against the assignment instructions and requirements. Be thorough but fair in your assessment.

Evaluate the submission based on:
1. Does it follow the assignment instructions?
2. Is the content correct and accurate?
3. Is it complete and addresses all parts of the assignment?
4. Quality of explanation and understanding demonstrated

Always respond with valid JSON in this exact format:
{
  "followsInstructions": true/false,
  "instructionScore": 0-100 (how well instructions were followed),
  "answerCorrectness": 0-100 (accuracy of the answers/content),
  "strengths": ["list of 2-4 specific strengths"],
  "improvements": ["list of 2-4 specific areas for improvement"],
  "detailedFeedback": "2-3 paragraph detailed feedback explaining the evaluation",
  "suggestedScore": 0-${assignment.max_score} (suggested score out of max)
}`
          },
          {
            role: "user",
            content: `ASSIGNMENT DETAILS:
Title: ${assignment.title}
Subject: ${assignment.subject}
Instructions/Requirements: ${assignment.description}
Maximum Score: ${assignment.max_score}

STUDENT'S SUBMISSION:
${studentContent}

Please evaluate this submission thoroughly and provide your assessment.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI service rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse AI response
    let evaluation;
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      evaluation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, aiContent);
      return new Response(JSON.stringify({ 
        error: "Failed to process evaluation",
        raw: aiContent 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store evaluation in database (upsert to handle re-evaluations)
    const { data: savedEvaluation, error: saveError } = await supabase
      .from("submission_evaluations")
      .upsert({
        submission_id: submissionId,
        follows_instructions: evaluation.followsInstructions,
        instruction_score: evaluation.instructionScore,
        answer_correctness: evaluation.answerCorrectness,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        detailed_feedback: evaluation.detailedFeedback,
        suggested_score: evaluation.suggestedScore,
        evaluated_by: user.id,
        evaluated_at: new Date().toISOString(),
      }, {
        onConflict: "submission_id",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save evaluation:", saveError);
      return new Response(JSON.stringify({ error: "Failed to save evaluation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      evaluation: savedEvaluation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
