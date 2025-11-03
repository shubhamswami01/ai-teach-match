import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RankBadge from "./RankBadge";
import { Plus, X, Save, Loader2 } from "lucide-react";

interface TeacherDashboardProps {
  userId: string;
}

const TeacherDashboard = ({ userId }: TeacherDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [occupation, setOccupation] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [bio, setBio] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("intermediate");

  useEffect(() => {
    loadTeacherProfile();
  }, [userId]);

  const loadTeacherProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setTeacherProfile(data);
        setOccupation(data.occupation);
        setYearsOfExperience(data.years_of_experience);
        setBio(data.bio || "");
        setExpertiseAreas(data.expertise_areas || []);
        loadSkills(data.id);
      }
    } catch (error: any) {
      console.error("Error loading teacher profile:", error);
    }
  };

  const loadSkills = async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("teacher_id", teacherId);

      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) {
      console.error("Error loading skills:", error);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const profileData = {
        user_id: userId,
        occupation,
        years_of_experience: yearsOfExperience,
        bio,
        expertise_areas: expertiseAreas,
        rank: 1, // Will be auto-calculated by trigger
      };

      let teacherId = teacherProfile?.id;

      if (teacherProfile) {
        const { error } = await supabase
          .from("teachers")
          .update(profileData)
          .eq("id", teacherProfile.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("teachers")
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        teacherId = data.id;
        setTeacherProfile(data);
      }

      toast({
        title: "Profile saved!",
        description: "Your teacher profile has been updated.",
      });

      loadTeacherProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !teacherProfile) return;

    try {
      const { error } = await supabase
        .from("skills")
        .insert([{
          teacher_id: teacherProfile.id,
          skill_name: newSkill,
          proficiency_level: newSkillLevel,
        }]);

      if (error) throw error;

      toast({ title: "Skill added!" });
      setNewSkill("");
      setNewSkillLevel("intermediate");
      loadSkills(teacherProfile.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", skillId);

      if (error) throw error;

      toast({ title: "Skill removed" });
      loadSkills(teacherProfile.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const calculateRank = (years: number) => {
    if (years >= 8) return 1;
    if (years >= 6) return 2;
    if (years >= 4) return 3;
    if (years >= 2) return 4;
    return 5;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your teaching profile and skills</p>
        </div>
        {teacherProfile && (
          <RankBadge rank={teacherProfile.rank} size="lg" />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your professional details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g., Software Engineer, Math Teacher"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Your rank will be: <RankBadge rank={calculateRank(yearsOfExperience)} size="sm" />
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Expertise Areas</Label>
            <div className="flex gap-2">
              <Input
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                placeholder="Add expertise area"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newExpertise.trim()) {
                    setExpertiseAreas([...expertiseAreas, newExpertise]);
                    setNewExpertise("");
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  if (newExpertise.trim()) {
                    setExpertiseAreas([...expertiseAreas, newExpertise]);
                    setNewExpertise("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {expertiseAreas.map((area, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {area}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setExpertiseAreas(expertiseAreas.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={saveProfile} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {teacherProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
            <CardDescription>Add and manage your teaching skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Skill name (e.g., Python Programming)"
              />
              <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-2">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{skill.skill_name}</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {skill.proficiency_level}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSkill(skill.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No skills added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherDashboard;