-- Assistant SCS — Database Schema
-- Supabase PostgreSQL

-- Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  role TEXT, -- coordonnateur, charge_se, responsable
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  code TEXT,
  title TEXT NOT NULL,
  programme_strategique TEXT,
  countries TEXT[],
  budget_total NUMERIC,
  budget_se NUMERIC,
  global_objective TEXT,
  status TEXT DEFAULT 'draft',
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Stakeholders
CREATE TABLE IF NOT EXISTS stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT,
  description TEXT,
  count INTEGER
);

ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD stakeholders via project" ON stakeholders FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = stakeholders.project_id AND projects.user_id = auth.uid()));

-- Results Chain
CREATE TABLE IF NOT EXISTS results_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  level TEXT,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES results_chain(id),
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE results_chain ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD results via project" ON results_chain FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = results_chain.project_id AND projects.user_id = auth.uid()));

-- Assumptions and Risks
CREATE TABLE IF NOT EXISTS assumptions_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  result_from_id UUID REFERENCES results_chain(id),
  result_to_id UUID REFERENCES results_chain(id),
  assumption TEXT,
  risk TEXT,
  probability TEXT,
  impact TEXT,
  mitigation TEXT
);

ALTER TABLE assumptions_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD assumptions via project" ON assumptions_risks FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = assumptions_risks.project_id AND projects.user_id = auth.uid()));

-- Indicators
CREATE TABLE IF NOT EXISTS indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  result_id UUID REFERENCES results_chain(id),
  code TEXT,
  title TEXT NOT NULL,
  definition TEXT,
  formula TEXT,
  unit TEXT,
  type TEXT,
  frequency TEXT,
  baseline_value NUMERIC,
  baseline_year INTEGER,
  baseline_source TEXT,
  target_2024 NUMERIC,
  target_2025 NUMERIC,
  target_2026 NUMERIC,
  target_2027 NUMERIC,
  disaggregations TEXT[],
  data_source TEXT,
  collection_method TEXT,
  responsible TEXT,
  smart_score JSONB,
  cad_criterion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD indicators via project" ON indicators FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = indicators.project_id AND projects.user_id = auth.uid()));

-- ERA Data
CREATE TABLE IF NOT EXISTS era_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  year INTEGER,
  raw_data JSONB,
  aggregated_data JSONB,
  qualitative_themes JSONB,
  analysis JSONB,
  scorecard JSONB,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE era_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD ERA data via project" ON era_data FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = era_data.project_id AND projects.user_id = auth.uid()));

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  role TEXT,
  content TEXT,
  step_context INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own messages" ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- Knowledge documents (admin-managed)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  filename TEXT,
  content TEXT,
  page_count INTEGER,
  char_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view knowledge documents" ON knowledge_documents FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert knowledge documents" ON knowledge_documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete knowledge documents" ON knowledge_documents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Questionnaires
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, archived
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD questionnaires via project" ON questionnaires FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = questionnaires.project_id AND projects.user_id = auth.uid()));

-- CMR (Cadre de Mesure du Rendement) configuration
CREATE TABLE IF NOT EXISTS cmr_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  periods JSONB DEFAULT '[]'::jsonb, -- [{ label, start, end }]
  targets JSONB DEFAULT '{}'::jsonb, -- { indicator_id: { baseline, periods: { period_key: value } } }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cmr_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD CMR via project" ON cmr_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = cmr_configs.project_id AND projects.user_id = auth.uid()));

-- Usage limits (per user / per month token quota)
CREATE TABLE IF NOT EXISTS usage_limits (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  tokens_used_this_month INTEGER NOT NULL DEFAULT 0,
  monthly_token_limit INTEGER NOT NULL DEFAULT 50000,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, month_year)
);

ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Usage logs (per-call breakdown)
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Atomic increment of monthly token usage
CREATE OR REPLACE FUNCTION increment_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_month TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO usage_limits
    (user_id, month_year, tokens_used_this_month, monthly_token_limit)
  VALUES (p_user_id, p_month, p_tokens, 50000)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    tokens_used_this_month =
      usage_limits.tokens_used_this_month + p_tokens,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Knowledge base (RAG chunks — queried by the analytical note generator)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  title TEXT,
  source TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read knowledge_base" ON knowledge_base FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert knowledge_base" ON knowledge_base FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base USING gin (to_tsvector('french', content));

-- Analytical notes (generated with Claude)
CREATE TABLE IF NOT EXISTS analytical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  scope_projects UUID[] DEFAULT ARRAY[]::UUID[],
  scope_ps TEXT[] DEFAULT ARRAY[]::TEXT[],
  scope_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  period_start DATE,
  period_end DATE,
  sections_selected TEXT[] DEFAULT ARRAY[]::TEXT[],
  detail_level TEXT DEFAULT 'standard', -- synthetique, standard, approfondi
  audience TEXT DEFAULT 'equipe_projet',
  content TEXT,
  status TEXT DEFAULT 'draft', -- draft, generating, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytical_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own analytical notes" ON analytical_notes FOR ALL
  USING (auth.uid() = user_id);

-- Public share links for analytical notes (7-day expiry by default)
CREATE TABLE IF NOT EXISTS note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES analytical_notes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shares of their notes" ON note_shares FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM analytical_notes
      WHERE analytical_notes.id = note_shares.note_id
        AND analytical_notes.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
