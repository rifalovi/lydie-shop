"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cx } from "@/lib/format";

type Props = {
  className?: string;
  variant?: "inline" | "mobile";
  onSubmitted?: () => void;
};

export function SearchBar({
  className,
  variant = "inline",
  onSubmitted,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      router.push(`/boutique?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/boutique");
    }
    onSubmitted?.();
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cx(
        "relative flex items-center",
        variant === "inline"
          ? "w-full max-w-[260px]"
          : "w-full",
        className,
      )}
    >
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher une perruque…"
        aria-label="Rechercher un produit"
        className={cx(
          "h-10 w-full rounded-full border border-borderSoft bg-white pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-rose-dark focus:outline-none",
          variant === "mobile" && "h-11 text-base",
        )}
      />
    </form>
  );
}
