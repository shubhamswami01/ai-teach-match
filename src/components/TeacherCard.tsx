import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RankBadge from "./RankBadge";
import { GraduationCap, Briefcase, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeacherCardProps {
  teacher: {
    id: string;
    profile: {
      full_name: string;
    };
    occupation: string;
    years_of_experience: number;
    rank: number;
    skill_name?: string;
    proficiency_level?: string;
    aiDescription?: string;
    expertise_areas?: string[];
  };
}

const TeacherCard = ({ teacher }: TeacherCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="gradient-card hover:shadow-elegant transition-smooth cursor-pointer group" onClick={() => navigate(`/teacher/${teacher.id}`)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-smooth">
              {teacher.profile.full_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
              <Briefcase className="h-3 w-3" />
              {teacher.occupation}
            </CardDescription>
          </div>
          <RankBadge rank={teacher.rank} />
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{teacher.years_of_experience} years experience</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 sm:space-y-3">
        {teacher.skill_name && (
          <div className="flex items-center gap-2 flex-wrap">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm sm:text-base">{teacher.skill_name}</span>
            {teacher.proficiency_level && (
              <Badge variant="secondary" className="capitalize text-xs">
                {teacher.proficiency_level}
              </Badge>
            )}
          </div>
        )}
        
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
          {teacher.aiDescription || "Experienced educator with a passion for teaching and helping students achieve their goals."}
        </p>

        {teacher.expertise_areas && teacher.expertise_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
            {teacher.expertise_areas.slice(0, 3).map((area, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
            {teacher.expertise_areas.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{teacher.expertise_areas.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-smooth"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teacher/${teacher.id}`);
          }}
        >
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TeacherCard;