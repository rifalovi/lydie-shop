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
