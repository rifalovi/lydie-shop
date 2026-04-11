import { Star } from "lucide-react";
import { cx } from "@/lib/format";

export function StarRating({
  value,
  size = 16,
  showValue = false,
  reviewCount,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={cx(
              "transition-colors",
              i <= Math.round(value)
                ? "fill-gold text-gold"
                : "text-borderSoft",
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="font-num text-sm text-ink">{value.toFixed(1)}</span>
      )}
      {typeof reviewCount === "number" && (
        <span className="text-xs text-ink-muted">({reviewCount})</span>
      )}
    </div>
  );
}
