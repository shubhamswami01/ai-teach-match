import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateSkillInput = (skill: unknown): string => {
  if (typeof skill !== 'string') {
    throw new Error('Skill must be a string');
  }
  
  const trimmed = skill.trim();
  
  if (trimmed.length < 2) {
    throw new Error('Search term must be at least 2 characters');
  }
  
  if (trimmed.length > 100) {
    throw new Error('Search term too long (max 100 characters)');
  }
  
  // Allow only alphanumeric, spaces, and hyphens
  if (!/^[a-zA-Z0-9\s-]+$/.test(trimmed)) {
    throw new Error('Search term contains invalid characters');
  }
  
  return trimmed;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skill } = await req.json();
    
    // Validate input
    let validatedSkill: string;
    try {
      validatedSkill = validateSkillInput(skill);
    } catch (validationError: unknown) {
      const errorMessage = validationError instanceof Error ? validationError.message : 'Invalid input';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Matching teachers for skill:', validatedSkill);

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
          expertise_areas
        )
      `)
      .ilike('skill_name', `%${validatedSkill}%`);

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      throw skillsError;
    }

    // Transform and rank teachers
    // First, collect unique user_ids to fetch profiles separately
    const teacherRecords = skillsData
      .filter((item: any) => item.teachers)
      .map((item: any) => (Array.isArray(item.teachers) ? item.teachers[0] : item.teachers))
      .filter(Boolean);

    const userIds = Array.from(new Set(teacherRecords.map((t: any) => t.user_id).filter(Boolean)));

    let profilesMap: Record<string, { id: string; full_name: string; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds as string[]);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        profilesMap = (profilesData || []).reduce((acc: Record<string, any>, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    const teachers = skillsData
      .filter((item: any) => item.teachers)
      .map((item: any) => {
        const teacher = Array.isArray(item.teachers) ? item.teachers[0] : item.teachers;
        const profile = teacher && teacher.user_id ? profilesMap[teacher.user_id] : undefined;
        return {
          ...teacher,
          skill_name: item.skill_name,
          proficiency_level: item.proficiency_level,
          profile,
        };
      })
      .sort((a: any, b: any) => a.rank - b.rank);

    console.log('Found teachers:', teachers.length);

    // Use AI to generate personalized descriptions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiEnhancedTeachers = await Promise.all(
      teachers.slice(0, 5).map(async (teacher) => {
        try {
          const prompt = `Generate a brief, engaging 2-sentence description for a teacher with these details:
Name: ${teacher.profile?.full_name || 'Experienced teacher'}
Occupation: ${teacher.occupation}
Experience: ${teacher.years_of_experience} years
Skill: ${teacher.skill_name} (${teacher.proficiency_level})
Expertise: ${teacher.expertise_areas?.join(', ') || 'Various areas'}

Make it professional and highlight why they're a great match for learning ${validatedSkill}.`;

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});