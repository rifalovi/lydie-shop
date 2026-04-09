"use client";

import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Contexte & parties prenantes" },
  { number: 2, label: "Chaîne de résultats" },
  { number: 3, label: "Hypothèses & risques" },
  { number: 4, label: "Indicateurs SMART" },
  { number: 5, label: "Indicateurs qualitatifs" },
  { number: 6, label: "Analyse ERA" },
];

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps?: number[];
}

export default function StepperIncubation({ currentStep, onStepClick, completedSteps = [] }: StepperProps) {
  return (
    <div className="bg-white border-b border-oif-gray-200 px-4 py-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = step.number === currentStep;
            const isCompleted = completedSteps.includes(step.number);
            const isPast = step.number < currentStep;

            return (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => onStepClick(step.number)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-oif-blue text-white ring-4 ring-oif-blue-50"
                        : isCompleted || isPast
                        ? "bg-oif-blue-light text-white"
                        : "bg-oif-gray-200 text-oif-gray-500 group-hover:bg-oif-gray-300"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  <span
                    className={`text-[11px] text-center max-w-[100px] leading-tight ${
                      isActive ? "text-oif-blue font-semibold" : "text-oif-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                      isPast || isCompleted ? "bg-oif-blue-light" : "bg-oif-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
