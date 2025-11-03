import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, Loader2 } from "lucide-react";

interface StudentDashboardProps {
  userId: string;
}

const StudentDashboard = ({ userId }: StudentDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchSkill, setSearchSkill] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchSkill.trim()) {
      toast({
        variant: "destructive",
        title: "Enter a skill",
        description: "Please enter a skill you want to learn",
      });
      return;
    }

    setSearching(true);
    navigate(`/search?skill=${encodeURIComponent(searchSkill)}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Find the perfect teacher for your learning journey</p>
      </div>

      <Card className="gradient-card shadow-elegant">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Discover Your Perfect Teacher</CardTitle>
          <CardDescription>
            Powered by AI to match you with top-ranked teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill" className="text-base">
                What skill do you want to learn?
              </Label>
              <Input
                id="skill"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                placeholder="e.g., Python Programming, Guitar, Photography"
                className="text-lg h-12"
                disabled={searching}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full text-base shadow-glow"
              disabled={searching}
            >
              {searching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Find Teachers
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Search for a Skill</h3>
              <p className="text-sm text-muted-foreground">
                Enter the skill you want to learn in the search box above
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">AI-Powered Matching</h3>
              <p className="text-sm text-muted-foreground">
                Our AI finds the best teachers ranked by experience and expertise
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Connect & Learn</h3>
              <p className="text-sm text-muted-foreground">
                View detailed profiles and connect with your chosen teacher
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;