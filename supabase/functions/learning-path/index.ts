import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student's grades
    const { data: grades, error: gradesError } = await supabase
      .from("grades")
      .select("*")
      .eq("student_id", user.id)
      .order("semester", { ascending: false });

    if (gradesError) {
      console.error("Error fetching grades:", gradesError);
      return new Response(JSON.stringify({ error: "Failed to fetch grades" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student's submissions with assignment details
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select(`
        *,
        assignments (
          title,
          subject,
          max_score
        )
      `)
      .eq("student_id", user.id);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    // Calculate performance metrics
    const subjectPerformance: Record<string, { totalScore: number; maxScore: number; count: number; grades: string[] }> = {};

    // Process grades
    grades?.forEach((grade) => {
      if (!subjectPerformance[grade.subject]) {
        subjectPerformance[grade.subject] = { totalScore: 0, maxScore: 0, count: 0, grades: [] };
      }
      subjectPerformance[grade.subject].grades.push(grade.grade_letter);
    });

    // Process submissions
    submissions?.forEach((sub) => {
      const subject = sub.assignments?.subject;
      if (subject && sub.score !== null) {
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { totalScore: 0, maxScore: 0, count: 0, grades: [] };
        }
        subjectPerformance[subject].totalScore += sub.score;
        subjectPerformance[subject].maxScore += sub.assignments?.max_score || 100;
        subjectPerformance[subject].count += 1;
      }
    });

    // Prepare performance summary for AI
    const performanceSummary = Object.entries(subjectPerformance).map(([subject, data]) => {
      const assignmentAverage = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : null;
      return {
        subject,
        assignmentAverage,
        assignmentCount: data.count,
        recentGrades: data.grades.slice(0, 3),
      };
    });

    // If no data, return empty recommendations
    if (performanceSummary.length === 0) {
      return new Response(JSON.stringify({
        recommendations: [],
        performanceGaps: [],
        message: "No performance data available yet. Complete some assignments to get personalized recommendations!"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI for recommendations
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
            content: `You are an educational AI assistant that analyzes student performance and provides personalized learning recommendations. Based on the student's performance data, identify areas where they need improvement and suggest specific learning resources and strategies.

Always respond with valid JSON in this exact format:
{
  "performanceGaps": [
    {
      "subject": "Subject Name",
      "issue": "Brief description of the performance gap",
      "severity": "high" | "medium" | "low"
    }
  ],
  "recommendations": [
    {
      "subject": "Subject Name",
      "title": "Resource or Strategy Title",
      "description": "Brief description of what to do",
      "type": "video" | "practice" | "reading" | "tutorial" | "exercise",
      "priority": "high" | "medium" | "low",
      "estimatedTime": "e.g., 30 mins, 1 hour"
    }
  ],
  "encouragement": "A brief encouraging message for the student"
}`
          },
          {
            role: "user",
            content: `Analyze this student's performance and provide personalized learning recommendations:

${JSON.stringify(performanceSummary, null, 2)}

Identify performance gaps (subjects with low scores or poor grades) and recommend specific resources to help improve. Focus on actionable recommendations.`
          }
        ],
        temperature: 0.7,
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
    let recommendations;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      recommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, aiContent);
      return new Response(JSON.stringify({ 
        error: "Failed to process recommendations",
        raw: aiContent 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ...recommendations,
      performanceSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Learning path error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
