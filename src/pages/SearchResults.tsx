import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import TeacherCard from "@/components/TeacherCard";
import { ArrowLeft, Loader2, Search } from "lucide-react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const skill = searchParams.get("skill") || "";

  useEffect(() => {
    if (skill) {
      searchTeachers();
    }
  }, [skill]);

  const searchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("match-teachers", {
        body: { skill },
      });

      if (error) throw error;

      setTeachers(data.teachers || []);

      if (data.teachers.length === 0) {
        toast({
          title: "No teachers found",
          description: `No teachers found for "${skill}". Try a different skill!`,
        });
      }
    } catch (error: any) {
      console.error("Error searching teachers:", error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Search Results</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Teachers for "{skill}"
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Finding the best teachers for you...</p>
              </div>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No teachers found</h2>
              <p className="text-muted-foreground mb-4">
                Try searching for a different skill
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Found {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {teachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;