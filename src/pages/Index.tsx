import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Award, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-20 px-4 relative">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">AI-Powered Skill Matching</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Connect with Expert Teachers
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Find the perfect teacher ranked by experience and expertise. Powered by AI to match your learning goals.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="shadow-glow text-base">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-base">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">How SkillMatch Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Teachers showcase their skills and experience. Students describe what they want to learn.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Ranking</h3>
              <p className="text-muted-foreground">
                Teachers are ranked by experience: 8+ years = Rank 1, ensuring quality matches.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Start Learning</h3>
              <p className="text-muted-foreground">
                Connect with top-ranked teachers and begin your educational journey today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-card">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of teachers and students already learning on SkillMatch
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="shadow-elegant text-base">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2025 SkillMatch. Connecting teachers and students worldwide.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
