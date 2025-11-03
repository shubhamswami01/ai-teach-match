import { Award } from "lucide-react";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

const RankBadge = ({ rank, size = "md" }: RankBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={`rank-badge-${rank} inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]} shadow-md`}
    >
      <Award className={iconSizes[size]} />
      <span>Rank {rank}</span>
    </div>
  );
};

export default RankBadge;