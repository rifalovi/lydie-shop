"use client";

import { X, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Indicator } from "@/lib/types";

interface Props {
  indicator: Indicator;
  onClose: () => void;
}

function smartPercentage(ind: Indicator): number | null {
  if (!ind.smart_score) return null;
  const total = Object.values(ind.smart_score).filter(Boolean).length;
  return Math.round((total / 5) * 100);
}

export default function IndicatorSheetModal({ indicator, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pct = smartPercentage(indicator);
  const smart = indicator.smart_score;

  function downloadPdf() {
    // Lightweight client-side "PDF" via the print dialog scoped to the sheet.
    if (!sheetRef.current) return;
    const html = sheetRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${
      indicator.title
    }</title><style>
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; padding: 24px; color: #1f2937; }
      h1, h2, h3 { color: #003F87; }
      h1 { font-size: 20px; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .05em; margin-top: 18px; }
      dl { display: grid; grid-template-columns: 160px 1fr; gap: 6px 12px; font-size: 13px; }
      dt { color: #6b7280; }
      .chip { display: inline-block; background: #e6f0fa; color: #003F87; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace; }
      ul { padding-left: 18px; font-size: 13px; }
    </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-oif-gray-200">
          <div>
            <h2 className="text-lg font-bold text-oif-blue">Fiche d&apos;indicateur</h2>
            <p className="text-xs text-oif-gray-500">Référentiel SSE OIF</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-1.5 text-sm text-oif-blue hover:bg-oif-blue-50 px-3 py-1.5 rounded-md"
            >
              <Download className="w-4 h-4" /> Télécharger PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-oif-gray-100 rounded-md"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={sheetRef} className="overflow-y-auto px-6 py-5 space-y-5 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {indicator.code && <span className="chip">{indicator.code}</span>}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  indicator.type === "quantitatif"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                {indicator.type}
              </span>
            </div>
            <h1 className="text-base font-semibold text-oif-gray-700">{indicator.title}</h1>
          </div>

          <section>
            <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
              Définition et portée
            </h2>
            <p className="text-oif-gray-700 whitespace-pre-line">
              {indicator.definition || "Non renseignée."}
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
              Formule de calcul
            </h2>
            <p className="font-mono text-oif-gray-700">
              {indicator.formula || "Non renseignée."}
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
              Baseline et cibles annuelles
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-oif-gray-400">Baseline</dt>
                <dd>
                  {indicator.baseline_value ?? "—"}
                  {indicator.baseline_year ? ` (${indicator.baseline_year})` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Cible 2024</dt>
                <dd>{indicator.target_2024 ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Cible 2025</dt>
                <dd>{indicator.target_2025 ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Cible 2026</dt>
                <dd>{indicator.target_2026 ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Cible 2027</dt>
                <dd>{indicator.target_2027 ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Unité</dt>
                <dd>{indicator.unit || "—"}</dd>
              </div>
            </dl>
            {indicator.baseline_source && (
              <p className="text-xs text-oif-gray-500 mt-2">
                Source baseline : {indicator.baseline_source}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
              Désagrégations
            </h2>
            {indicator.disaggregations && indicator.disaggregations.length > 0 ? (
              <ul className="list-disc pl-5">
                {indicator.disaggregations.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : (
              <p className="text-oif-gray-500">Aucune désagrégation définie.</p>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
              RACI (responsabilité)
            </h2>
            <dl className="grid sm:grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-oif-gray-400">Responsable</dt>
                <dd>{indicator.responsible || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Source de données</dt>
                <dd>{indicator.data_source || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Méthode de collecte</dt>
                <dd>{indicator.collection_method || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-oif-gray-400">Fréquence</dt>
                <dd>{indicator.frequency || "—"}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
              Score SMART
            </h2>
            {pct !== null ? (
              <div className="space-y-2">
                <div
                  className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                    pct >= 85
                      ? "bg-green-100 text-green-700"
                      : pct >= 60
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  SMART {pct}%
                </div>
                {smart && (
                  <ul className="grid grid-cols-5 gap-2 mt-2">
                    {(["S", "M", "A", "R", "T"] as const).map((k) => (
                      <li
                        key={k}
                        className={`text-center rounded-md py-1 text-xs font-medium ${
                          smart[k] ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {k}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-oif-gray-500">Score SMART non évalué.</p>
            )}
          </section>

          {indicator.cad_criterion && (
            <section>
              <h2 className="text-xs font-semibold text-oif-gray-500 uppercase tracking-wider mb-2">
                Critère CAD/OCDE
              </h2>
              <p>{indicator.cad_criterion}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
