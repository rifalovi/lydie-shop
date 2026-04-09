"use client";

import { BookOpen, CheckCircle, PlayCircle } from "lucide-react";

const modules = [
  {
    title: "Introduction à la GAR",
    description: "Comprendre les principes fondamentaux de la Gestion Axée sur les Résultats dans le contexte OIF.",
    duration: "45 min",
    status: "available",
  },
  {
    title: "La chaîne de résultats",
    description: "Maîtriser les 6 niveaux : intrants, activités, extrants, effets immédiats, effets intermédiaires, impacts.",
    duration: "60 min",
    status: "available",
  },
  {
    title: "Formuler des indicateurs SMART",
    description: "Apprendre à créer des indicateurs Spécifiques, Mesurables, Atteignables, Pertinents et Temporellement définis.",
    duration: "60 min",
    status: "available",
  },
  {
    title: "Le cadre logique (logframe)",
    description: "Construire un cadre logique complet conforme au Référentiel SSE OIF.",
    duration: "45 min",
    status: "available",
  },
  {
    title: "L'enquête ERA",
    description: "Comprendre et administrer un questionnaire ERA pour évaluer les résultats d'un projet.",
    duration: "50 min",
    status: "available",
  },
  {
    title: "Les critères CAD/OCDE",
    description: "Analyser les résultats selon les 6 critères : pertinence, cohérence, efficacité, efficience, impact, durabilité.",
    duration: "55 min",
    status: "available",
  },
];

export default function FormationPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Formation GAR/S&amp;E
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Parcours de formation interactif sur la Gestion Axée sur les Résultats et le Suivi-Évaluation.
        </p>
      </div>

      <div className="space-y-4">
        {modules.map((mod, idx) => (
          <div key={idx} className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-oif-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-6 h-6 text-oif-blue-light" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-oif-gray-700">{mod.title}</h3>
              <p className="text-sm text-oif-gray-500 mt-0.5">{mod.description}</p>
              <span className="text-xs text-oif-gray-400 mt-1 inline-block">{mod.duration}</span>
            </div>
            <button className="btn-secondary text-sm py-2">
              Commencer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
