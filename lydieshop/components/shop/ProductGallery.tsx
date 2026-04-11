"use client";

import { useState } from "react";
import { cx } from "@/lib/format";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-luxe border border-borderSoft bg-rose-light">
        <img
          src={images[active]}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <button
              key={img}
              onClick={() => setActive(idx)}
              className={cx(
                "aspect-square overflow-hidden rounded-soft border-2 bg-white transition-all",
                active === idx
                  ? "border-rose-dark shadow-soft"
                  : "border-borderSoft hover:border-rose",
              )}
            >
              <img
                src={img}
                alt={`${alt} miniature ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
