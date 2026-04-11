import { Crown } from "lucide-react";

export function CrownIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return <Crown className={className} aria-hidden="true" />;
}
