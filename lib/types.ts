export interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  unit: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  code: string | null;
  title: string;
  programme_strategique: string | null;
  countries: string[];
  budget_total: number | null;
  budget_se: number | null;
  global_objective: string | null;
  status: "draft" | "active" | "completed";
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface Stakeholder {
  id: string;
  project_id: string;
  type: "beneficiaire_direct" | "beneficiaire_indirect" | "partenaire" | "intermediaire";
  description: string | null;
  count: number | null;
}

export interface ResultChainItem {
  id: string;
  project_id: string;
  level: "intrant" | "activite" | "extrant" | "effet_immediat" | "effet_intermediaire" | "impact";
  code: string | null;
  title: string;
  description: string | null;
  parent_id: string | null;
  order_index: number | null;
  created_at: string;
}

export interface AssumptionRisk {
  id: string;
  project_id: string;
  result_from_id: string | null;
  result_to_id: string | null;
  assumption: string | null;
  risk: string | null;
  probability: "faible" | "moyen" | "eleve" | null;
  impact: "faible" | "moyen" | "eleve" | null;
  mitigation: string | null;
}

export interface Indicator {
  id: string;
  project_id: string;
  result_id: string | null;
  code: string | null;
  title: string;
  definition: string | null;
  formula: string | null;
  unit: string | null;
  type: "quantitatif" | "qualitatif";
  frequency: string | null;
  baseline_value: number | null;
  baseline_year: number | null;
  baseline_source: string | null;
  target_2024: number | null;
  target_2025: number | null;
  target_2026: number | null;
  target_2027: number | null;
  disaggregations: string[];
  data_source: string | null;
  collection_method: string | null;
  responsible: string | null;
  smart_score: SmartScore | null;
  cad_criterion: string | null;
  created_at: string;
}

export interface SmartScore {
  S: boolean;
  M: boolean;
  A: boolean;
  R: boolean;
  T: boolean;
}

export interface EraData {
  id: string;
  project_id: string;
  year: number | null;
  raw_data: any;
  aggregated_data: any;
  qualitative_themes: any;
  analysis: any;
  scorecard: any;
  recommendations: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  project_id: string | null;
  role: "user" | "assistant";
  content: string;
  step_context: number | null;
  created_at: string;
}

export const RESULT_LEVELS = [
  { value: "intrant", label: "Intrants (Inputs)", color: "#94A3B8" },
  { value: "activite", label: "Activités", color: "#0078C8" },
  { value: "extrant", label: "Extrants (Outputs)", color: "#003F87" },
  { value: "effet_immediat", label: "Effets immédiats", color: "#059669" },
  { value: "effet_intermediaire", label: "Effets intermédiaires", color: "#D97706" },
  { value: "impact", label: "Impacts", color: "#DC2626" },
] as const;

export interface KnowledgeDocument {
  id: string;
  uploaded_by: string | null;
  title: string;
  filename: string | null;
  content: string | null;
  page_count: number | null;
  char_count: number | null;
  created_at: string;
}

export type QuestionType =
  | "oui_non"
  | "echelle_1_5"
  | "texte_libre"
  | "choix_multiple"
  | "nombre";

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  type: QuestionType;
  indicator_id?: string | null;
  indicator_code?: string | null;
  options?: string[];
  required?: boolean;
}

export interface Questionnaire {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "archived";
  questions: QuestionnaireQuestion[];
  created_at: string;
  updated_at: string;
}

export interface CmrPeriod {
  key: string; // e.g. "2024-T1"
  label: string;
  start: string | null;
  end: string | null;
}

export interface CmrIndicatorTargets {
  baseline: number | null;
  periods: Record<string, number | null>;
}

export interface CmrConfig {
  id: string;
  project_id: string;
  periods: CmrPeriod[];
  targets: Record<string, CmrIndicatorTargets>;
  created_at: string;
  updated_at: string;
}

export type AnalyticalNoteStatus = "draft" | "generating" | "completed" | "failed";

export interface AnalyticalNote {
  id: string;
  user_id: string;
  subject: string;
  scope_projects: string[];
  scope_ps: string[];
  scope_countries: string[];
  period_start: string | null;
  period_end: string | null;
  sections_selected: string[];
  detail_level: "synthetique" | "standard" | "approfondi";
  audience: string;
  content: string | null;
  status: AnalyticalNoteStatus;
  created_at: string;
  updated_at: string;
}

export interface NoteShare {
  id: string;
  note_id: string;
  token: string;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

export const ANALYTICAL_NOTE_SECTIONS = [
  { value: "introduction", label: "1. Introduction et contexte" },
  { value: "objectifs", label: "2. Objectifs de l'analyse" },
  { value: "methodologie", label: "3. Méthodologie" },
  { value: "analyse_projets", label: "4. Analyse par projet" },
  { value: "contributions", label: "5. Contributions et résultats clés" },
  { value: "enseignements", label: "6. Enseignements tirés" },
  { value: "vigilance", label: "7. Points de vigilance" },
  { value: "recommandations", label: "8. Recommandations stratégiques" },
  { value: "annexes", label: "9. Annexes" },
] as const;

export const PROGRAMMES_STRATEGIQUES = [
  { value: "PS1", label: "PS1 — Langue française, diversité culturelle et linguistique" },
  { value: "PS2", label: "PS2 — Paix, démocratie, droits de l'Homme" },
  { value: "PS3", label: "PS3 — Éducation, formation, enseignement supérieur et recherche" },
] as const;

export const STAKEHOLDER_TYPES = [
  { value: "beneficiaire_direct", label: "Bénéficiaires directs" },
  { value: "beneficiaire_indirect", label: "Bénéficiaires indirects" },
  { value: "partenaire", label: "Partenaires de mise en œuvre" },
  { value: "intermediaire", label: "Intermédiaires" },
] as const;
