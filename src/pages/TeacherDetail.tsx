import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RankBadge from "@/components/RankBadge";
import { ArrowLeft, Loader2, Mail, Briefcase, Calendar, GraduationCap } from "lucide-react";

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTeacherDetails();
    }
  }, [id]);

  const loadTeacherDetails = async () => {
    setLoading(true);
    try {
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (teacherError) throw teacherError;

      // Fetch profile separately using user_id
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", teacherData.user_id)
        .single();

      if (profileError) throw profileError;

      const { data: skillsData, error: skillsError } = await supabase
        .from("skills")
        .select("*")
        .eq("teacher_id", id);

      if (skillsError) throw skillsError;

      setTeacher({ ...teacherData, profiles: profileData });
      setSkills(skillsData || []);
    } catch (error: any) {
      console.error("Error loading teacher:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load teacher details",
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="gradient-card shadow-elegant">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{teacher.profiles.full_name}</CardTitle>
                  <div className="flex flex-col gap-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{teacher.occupation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{teacher.years_of_experience} years of experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{teacher.profiles.email}</span>
                    </div>
                  </div>
                </div>
                <RankBadge rank={teacher.rank} size="lg" />
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {teacher.bio && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">About</h3>
                  <p className="text-muted-foreground">{teacher.bio}</p>
                </div>
              )}

              {teacher.expertise_areas && teacher.expertise_areas.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Expertise Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.expertise_areas.map((area: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No skills listed yet
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-smooth"
                    >
                      <h4 className="font-semibold text-lg mb-2">{skill.skill_name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {skill.proficiency_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gradient-hero text-white">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Ready to Learn?</h3>
                <p className="text-white/90">
                  Connect with {teacher.profiles.full_name} to start your learning journey
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => {
                    window.location.href = `mailto:${teacher.profiles.email}?subject=Learning Opportunity`;
                  }}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Email Teacher
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDetail;