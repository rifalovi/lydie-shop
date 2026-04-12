"use client";

import { Crown } from "lucide-react";
import { cx } from "@/lib/format";

type Props = {
  photosCount: number;
  descriptionLength: number; // word count
  attributesFilled: number;
  attributesTotal: number;
  hasSeoTitle: boolean;
  hasSeoDesc: boolean;
  hasComparePrice: boolean;
  variantsCount: number; // not yet used in create form, but future-proof
};

export function QualityScore(props: Props) {
  const photos = Math.min(20, Math.round((props.photosCount / 3) * 20));
  const desc = Math.min(20, Math.round((props.descriptionLength / 200) * 20));
  const attrs =
    props.attributesTotal > 0
      ? Math.round((props.attributesFilled / props.attributesTotal) * 20)
      : 20; // no attributes = full score
  const seo = (props.hasSeoTitle ? 10 : 0) + (props.hasSeoDesc ? 10 : 0);
  const prix = props.hasComparePrice ? 10 : 0;
  const variants = Math.min(10, props.variantsCount * 5);
  const total = photos + desc + attrs + seo + prix + variants;

  const color =
    total >= 80 ? "text-gold-dark" : total >= 60 ? "text-rose-dark" : "text-ink-muted";
  const bg =
    total >= 80
      ? "bg-gradient-gold"
      : total >= 60
        ? "bg-gradient-royal"
        : "bg-borderSoft";
  const label =
    total >= 80 ? "Fiche parfaite 👑" : total >= 60 ? "Bonne fiche" : "À compléter";

  return (
    <div className="card-luxe p-5">
      <div className="flex items-center justify-between">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Score qualité
        </p>
        <div className={cx("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-ui font-bold text-white", bg)}>
          {total >= 80 && <Crown className="h-3.5 w-3.5" />}
          {total}/100
        </div>
      </div>
      <p className={cx("mt-1 text-sm font-semibold", color)}>{label}</p>
      <div className="mt-3 space-y-1.5 text-xs">
        <Bar label="Photos (3+)" value={photos} max={20} />
        <Bar label="Description (200+ mots)" value={desc} max={20} />
        <Bar label="Attributs" value={attrs} max={20} />
        <Bar label="SEO (title + meta)" value={seo} max={20} />
        <Bar label="Prix barré" value={prix} max={10} />
        <Bar label="Variantes (2+)" value={variants} max={10} />
      </div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 text-ink-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-borderSoft">
        <div
          className={cx("h-full rounded-full transition-all", pct >= 100 ? "bg-gold" : pct >= 50 ? "bg-rose-dark" : "bg-borderSoft")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-num font-bold text-ink">{value}/{max}</span>
    </div>
  );
}
