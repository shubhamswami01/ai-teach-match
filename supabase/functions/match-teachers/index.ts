import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skill } = await req.json();
    console.log('Matching teachers for skill:', skill);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get teachers with the skill
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select(`
        teacher_id,
        skill_name,
        proficiency_level,
        teachers (
          id,
          user_id,
          occupation,
          years_of_experience,
          rank,
          bio,
          expertise_areas,
          profiles (
            full_name,
            email
          )
        )
      `)
      .ilike('skill_name', `%${skill}%`);

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      throw skillsError;
    }

    // Transform and rank teachers
    const teachers = skillsData
      .filter(item => item.teachers)
      .map(item => {
        const teacher = Array.isArray(item.teachers) ? item.teachers[0] : item.teachers;
        const profile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles;
        return {
          ...teacher,
          skill_name: item.skill_name,
          proficiency_level: item.proficiency_level,
          profile
        };
      })
      .sort((a, b) => a.rank - b.rank);

    console.log('Found teachers:', teachers.length);

    // Use AI to generate personalized descriptions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiEnhancedTeachers = await Promise.all(
      teachers.slice(0, 5).map(async (teacher) => {
        try {
          const prompt = `Generate a brief, engaging 2-sentence description for a teacher with these details:
Name: ${teacher.profile.full_name}
Occupation: ${teacher.occupation}
Experience: ${teacher.years_of_experience} years
Skill: ${teacher.skill_name} (${teacher.proficiency_level})
Expertise: ${teacher.expertise_areas?.join(', ') || 'Various areas'}

Make it professional and highlight why they're a great match for learning ${skill}.`;

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are a helpful assistant that creates engaging teacher profiles.' },
                { role: 'user', content: prompt }
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const aiDescription = data.choices[0]?.message?.content || teacher.bio || 'Experienced educator ready to help you learn.';
            return { ...teacher, aiDescription };
          } else {
            console.error('AI API error:', response.status);
            return { ...teacher, aiDescription: teacher.bio || 'Experienced educator ready to help you learn.' };
          }
        } catch (error) {
          console.error('Error generating AI description:', error);
          return { ...teacher, aiDescription: teacher.bio || 'Experienced educator ready to help you learn.' };
        }
      })
    );

    return new Response(
      JSON.stringify({ teachers: aiEnhancedTeachers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-teachers function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});