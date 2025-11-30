import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("`check-achievements` function initialized");

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record: userProgress } = await req.json();

    if (!userProgress) {
      throw new Error("User progress data not provided in the request body.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const studentId = userProgress.student_id;

    // 1. Get all achievements from the database
    const { data: allAchievements, error: achievementsError } = await supabaseAdmin
      .from("achievements")
      .select("*");

    if (achievementsError) throw achievementsError;

    // 2. Get all achievements the user already has
    const { data: userAchievements, error: userAchievementsError } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id")
      .eq("student_id", studentId);

    if (userAchievementsError) throw userAchievementsError;
    
    const userAchievementIds = new Set(userAchievements.map(a => a.achievement_id));

    // 3. Get the student's total progress stats
    const { data: userProgressHistory, error: progressHistoryError } = await supabaseAdmin
      .from("user_progress")
      .select("score, time_taken")
      .eq("student_id", studentId);

    if (progressHistoryError) throw progressHistoryError;

    const quizzesCompleted = userProgressHistory.length;

    // 4. Check each achievement that the user does NOT have yet
    for (const achievement of allAchievements) {
      if (userAchievementIds.has(achievement.id)) {
        continue; // Skip achievements the user already has
      }

      let isAchieved = false;
      const requirements = achievement.requirements;

      // Logic for different achievement types
      if (requirements.perfect_score && userProgress.score === 100) {
        isAchieved = true;
      } else if (requirements.fast_completion && userProgress.time_taken <= requirements.fast_completion) {
        isAchieved = true;
      } else if (requirements.quizzes_completed && quizzesCompleted >= requirements.quizzes_completed) {
        isAchieved = true;
      }
      // NOTE: More complex achievements like streaks will need more logic here.

      if (isAchieved) {
        // 5. Grant the achievement
        const { error: insertError } = await supabaseAdmin
          .from("user_achievements")
          .insert({
            student_id: studentId,
            achievement_id: achievement.id,
          });
        
        if (insertError) {
          console.error(`Failed to grant achievement ${achievement.name}:`, insertError);
          continue; // Move to the next achievement
        }

        // 6. Update user's total points
        const { error: updatePointsError } = await supabaseAdmin.rpc('increment_student_points', {
          student_uuid: studentId,
          points_to_add: achievement.points_reward
        });

        if (updatePointsError) {
          console.error(`Failed to update points for student ${studentId}:`, updatePointsError);
        }

        console.log(`Achievement "${achievement.name}" granted to student ${studentId}`);
      }
    }

    return new Response(JSON.stringify({ message: "Achievements checked successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
