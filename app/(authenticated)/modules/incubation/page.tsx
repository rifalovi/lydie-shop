"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StepperIncubation from "@/components/incubation/StepperIncubation";
import Step1Context from "@/components/incubation/Step1Context";
import Step2ResultsChain from "@/components/incubation/Step2ResultsChain";
import Step3Assumptions from "@/components/incubation/Step3Assumptions";
import Step4Indicators from "@/components/incubation/Step4Indicators";
import Step5QualitativeIndicators from "@/components/incubation/Step5QualitativeIndicators";
import Step6EraAnalysis from "@/components/incubation/Step6EraAnalysis";
import ChatWidget from "@/components/ChatWidget";
import type { Project } from "@/lib/types";
import { Rocket, Plus } from "lucide-react";

export default function IncubationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("projectId"));
  const [project, setProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) setProjects(data);

      if (projectId) {
        const { data: p } = await supabase.from("projects").select("*").eq("id", projectId).single();
        if (p) {
          setProject(p);
          setCurrentStep(p.current_step || 1);
        }
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  async function createProject() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("projects")
      .insert({ user_id: user.id, title: "Nouveau projet", status: "draft", current_step: 1 })
      .select()
      .single();

    if (data) {
      setProjectId(data.id);
      setProject(data);
      setCurrentStep(1);
    }
  }

  function goToStep(step: number) {
    setCurrentStep(step);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-oif-gray-400">Chargement...</div>
      </div>
    );
  }

  // Project selection screen
  if (!projectId) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
            <Rocket className="w-6 h-6" /> Module d&apos;incubation
          </h1>
          <p className="text-oif-gray-500 mt-1">
            Sélectionnez un projet existant ou créez-en un nouveau pour démarrer l&apos;incubation en 6 étapes.
          </p>
        </div>

        <button onClick={createProject} className="btn-primary flex items-center gap-2 mb-6">
          <Plus className="w-4 h-4" /> Nouveau projet
        </button>

        {projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-oif-gray-500 uppercase tracking-wider">Projets existants</h2>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setProjectId(p.id)}
                className="card w-full text-left hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {p.code && (
                      <span className="text-xs font-mono bg-oif-blue-50 text-oif-blue px-2 py-0.5 rounded">{p.code}</span>
                    )}
                    <span className="text-xs text-oif-gray-400">{p.programme_strategique}</span>
                  </div>
                  <p className="font-medium text-oif-gray-700">{p.title}</p>
                  <p className="text-xs text-oif-gray-400 mt-1">
                    Étape {p.current_step}/6 — Dernière modification : {new Date(p.updated_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="w-16">
                  <div className="h-2 bg-oif-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-oif-blue-light rounded-full" style={{ width: `${(p.current_step / 6) * 100}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <StepperIncubation
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
      />

      <div className="flex-1 overflow-auto">
        {currentStep === 1 && <Step1Context projectId={projectId} onNext={() => goToStep(2)} />}
        {currentStep === 2 && <Step2ResultsChain projectId={projectId} onNext={() => goToStep(3)} onPrev={() => goToStep(1)} />}
        {currentStep === 3 && <Step3Assumptions projectId={projectId} onNext={() => goToStep(4)} onPrev={() => goToStep(2)} />}
        {currentStep === 4 && <Step4Indicators projectId={projectId} onNext={() => goToStep(5)} onPrev={() => goToStep(3)} />}
        {currentStep === 5 && <Step5QualitativeIndicators projectId={projectId} onNext={() => goToStep(6)} onPrev={() => goToStep(4)} />}
        {currentStep === 6 && <Step6EraAnalysis projectId={projectId} onPrev={() => goToStep(5)} />}
      </div>

      {/* Floating chat */}
      <ChatWidget projectId={projectId} currentStep={currentStep} />
    </div>
  );
}
