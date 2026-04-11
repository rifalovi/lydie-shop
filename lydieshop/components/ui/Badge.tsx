import type { ReactNode } from "react";
import { cx } from "@/lib/format";

type Variant = "new" | "sale" | "bestseller" | "neutral";

const variantClass: Record<Variant, string> = {
  new: "badge-new",
  sale: "badge-sale",
  bestseller: "badge-bestseller",
  neutral: "badge bg-cream border border-borderSoft text-ink-muted",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return <span className={cx(variantClass[variant], className)}>{children}</span>;
}
