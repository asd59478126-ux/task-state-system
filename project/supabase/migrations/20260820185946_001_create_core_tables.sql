/*
# Event Result Integration Evolution Model - Core Schema v0.1

## Overview
Creates the complete relational database schema for the Event Result Integration Evolution Model,
implementing the data architecture defined in the specification documents.

## New Tables
1. cases - Case management with context model tracking
2. events - Observable events (minimum data unit)
3. states - States derived from events
4. tasks - Tasks derived from states
5. feedback - Results from task execution
6. evolution_candidates - Interface layer between case data and evolution engine
7. evolution_rules - Validated evolution rules from cross-case analysis
8. validation_reports - Validation reports for each parsing run

## Enums
- source_type_enum: HUMAN_OBSERVED, HUMAN_CONFIRMED, SYSTEM_RESULT, AI_GENERATED
- data_status_enum: RAW, UNCONFIRMED, CONFIRMED, DERIVED
- context_model_enum: LIVE_CONVERSATION, ARCHIVED_CASE, DATASET_IMPORT, UNKNOWN
- state_lifecycle_enum: ACTIVE, UPDATED, COMPLETED, ARCHIVED
- task_type_enum: FORMAL_TASK, TASK_CANDIDATE, EXPLORATION
- task_status_enum: PENDING, IN_PROGRESS, COMPLETED, BLOCKED, CANCELLED
- feedback_type_enum: TASK_RESULT, SYSTEM_RESULT, HUMAN_EVALUATION, UNRESOLVED_RESULT
- evolution_interface_status_enum: READY, PENDING_PATTERN, NOT_AVAILABLE
- case_closure_enum: OPEN, CLOSED, UNKNOWN

## Security
- RLS enabled on all tables
- Single-tenant (no auth) - policies allow anon + authenticated full CRUD
- Data is intentionally shared/public within this tool

## Important Notes
- All foreign keys use ON DELETE CASCADE to maintain referential integrity
- The data flow is strictly: Event -> State -> Task -> Feedback -> Evolution Candidate -> Evolution Rule
- Evolution Candidate Table Data_Status must NEVER be DERIVED (only for Evolution Rules)
- AI_GENERATED source cannot become CONFIRMED status
*/

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE source_type_enum AS ENUM ('HUMAN_OBSERVED', 'HUMAN_CONFIRMED', 'SYSTEM_RESULT', 'AI_GENERATED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE data_status_enum AS ENUM ('RAW', 'UNCONFIRMED', 'CONFIRMED', 'DERIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE context_model_enum AS ENUM ('LIVE_CONVERSATION', 'ARCHIVED_CASE', 'DATASET_IMPORT', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE state_lifecycle_enum AS ENUM ('ACTIVE', 'UPDATED', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_type_enum AS ENUM ('FORMAL_TASK', 'TASK_CANDIDATE', 'EXPLORATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE feedback_type_enum AS ENUM ('TASK_RESULT', 'SYSTEM_RESULT', 'HUMAN_EVALUATION', 'UNRESOLVED_RESULT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE evolution_interface_status_enum AS ENUM ('READY', 'PENDING_PATTERN', 'NOT_AVAILABLE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE case_closure_enum AS ENUM ('OPEN', 'CLOSED', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- CASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_name text NOT NULL,
  description text,
  context_model context_model_enum NOT NULL DEFAULT 'UNKNOWN',
  closure_status case_closure_enum NOT NULL DEFAULT 'OPEN',
  boundary_status text DEFAULT 'PASS',
  boundary_reason text,
  goal text,
  parser_version text DEFAULT 'v1.8',
  schema_version text DEFAULT 'v0.3',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cases" ON cases;
CREATE POLICY "anon_select_cases" ON cases FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cases" ON cases;
CREATE POLICY "anon_insert_cases" ON cases FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cases" ON cases;
CREATE POLICY "anon_update_cases" ON cases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cases" ON cases;
CREATE POLICY "anon_delete_cases" ON cases FOR DELETE TO anon, authenticated USING (true);

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_time timestamptz,
  event_type text,
  actor text,
  target text,
  description text NOT NULL,
  result text,
  source_type source_type_enum NOT NULL DEFAULT 'HUMAN_OBSERVED',
  data_status data_status_enum NOT NULL DEFAULT 'RAW',
  related_task_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id);

-- ============================================
-- STATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  related_event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  state_type text,
  state_description text NOT NULL,
  state_evidence text,
  lifecycle_status state_lifecycle_enum NOT NULL DEFAULT 'ACTIVE',
  source_type source_type_enum NOT NULL DEFAULT 'HUMAN_OBSERVED',
  data_status data_status_enum NOT NULL DEFAULT 'RAW',
  version integer NOT NULL DEFAULT 1,
  is_latest boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_states" ON states;
CREATE POLICY "anon_select_states" ON states FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_states" ON states;
CREATE POLICY "anon_insert_states" ON states FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_states" ON states;
CREATE POLICY "anon_update_states" ON states FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_states" ON states;
CREATE POLICY "anon_delete_states" ON states FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_states_case_id ON states(case_id);
CREATE INDEX IF NOT EXISTS idx_states_event_id ON states(related_event_id);

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  related_state_id uuid NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  task_type task_type_enum NOT NULL DEFAULT 'TASK_CANDIDATE',
  task_description text NOT NULL,
  completion_criteria text,
  task_source text,
  task_status task_status_enum NOT NULL DEFAULT 'PENDING',
  priority integer DEFAULT 0,
  assigned_to text,
  requires_human_review boolean NOT NULL DEFAULT false,
  review_status text,
  data_status data_status_enum NOT NULL DEFAULT 'RAW',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_state_id ON tasks(related_state_id);

-- ============================================
-- FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  related_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  feedback_type feedback_type_enum NOT NULL DEFAULT 'TASK_RESULT',
  feedback_content text NOT NULL,
  observation text,
  result_status text,
  generates_new_event boolean NOT NULL DEFAULT false,
  source_type source_type_enum NOT NULL DEFAULT 'SYSTEM_RESULT',
  data_status data_status_enum NOT NULL DEFAULT 'RAW',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_feedback" ON feedback;
CREATE POLICY "anon_select_feedback" ON feedback FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback;
CREATE POLICY "anon_insert_feedback" ON feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_feedback" ON feedback;
CREATE POLICY "anon_update_feedback" ON feedback FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_feedback" ON feedback;
CREATE POLICY "anon_delete_feedback" ON feedback FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_feedback_case_id ON feedback(case_id);
CREATE INDEX IF NOT EXISTS idx_feedback_task_id ON feedback(related_task_id);

-- ============================================
-- EVOLUTION CANDIDATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS evolution_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  knowledge_context_id text,
  context_model context_model_enum NOT NULL DEFAULT 'UNKNOWN',
  parser_status text DEFAULT 'PARSED',
  evidence_chains jsonb,
  observation_count integer NOT NULL DEFAULT 0,
  required_additional_cases integer NOT NULL DEFAULT 1,
  temporal_order text,
  ready_for_evolution_engine boolean NOT NULL DEFAULT false,
  evolution_interface_status evolution_interface_status_enum NOT NULL DEFAULT 'NOT_AVAILABLE',
  data_status data_status_enum NOT NULL DEFAULT 'UNCONFIRMED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evolution_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_evolution_candidates" ON evolution_candidates;
CREATE POLICY "anon_select_evolution_candidates" ON evolution_candidates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_evolution_candidates" ON evolution_candidates;
CREATE POLICY "anon_insert_evolution_candidates" ON evolution_candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_evolution_candidates" ON evolution_candidates;
CREATE POLICY "anon_update_evolution_candidates" ON evolution_candidates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_evolution_candidates" ON evolution_candidates;
CREATE POLICY "anon_delete_evolution_candidates" ON evolution_candidates FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_evo_candidates_case_id ON evolution_candidates(case_id);

-- ============================================
-- EVOLUTION RULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS evolution_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  source_data text,
  target_category text,
  previous_rule text,
  new_rule text NOT NULL,
  evidence_chain_ids text,
  observation_count integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  version text NOT NULL DEFAULT 'v1.0',
  data_status data_status_enum NOT NULL DEFAULT 'DERIVED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evolution_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_evolution_rules" ON evolution_rules;
CREATE POLICY "anon_select_evolution_rules" ON evolution_rules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_evolution_rules" ON evolution_rules;
CREATE POLICY "anon_insert_evolution_rules" ON evolution_rules FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_evolution_rules" ON evolution_rules;
CREATE POLICY "anon_update_evolution_rules" ON evolution_rules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_evolution_rules" ON evolution_rules;
CREATE POLICY "anon_delete_evolution_rules" ON evolution_rules FOR DELETE TO anon, authenticated USING (true);

-- ============================================
-- VALIDATION REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS validation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  context_model_result context_model_enum,
  context_closure_status text,
  event_extraction_result text,
  state_transformation_result text,
  task_transformation_result text,
  feedback_validation_result text,
  evolution_interface_result text,
  blocking_reasons text,
  needs_human_confirm boolean NOT NULL DEFAULT false,
  overall_status text NOT NULL DEFAULT 'PASS',
  parser_version text DEFAULT 'v1.8',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE validation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_validation_reports" ON validation_reports;
CREATE POLICY "anon_select_validation_reports" ON validation_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_validation_reports" ON validation_reports;
CREATE POLICY "anon_insert_validation_reports" ON validation_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_validation_reports" ON validation_reports;
CREATE POLICY "anon_update_validation_reports" ON validation_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_validation_reports" ON validation_reports;
CREATE POLICY "anon_delete_validation_reports" ON validation_reports FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_validation_case_id ON validation_reports(case_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cases_updated ON cases;
CREATE TRIGGER trigger_cases_updated BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_states_updated ON states;
CREATE TRIGGER trigger_states_updated BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_tasks_updated ON tasks;
CREATE TRIGGER trigger_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_evo_candidates_updated ON evolution_candidates;
CREATE TRIGGER trigger_evo_candidates_updated BEFORE UPDATE ON evolution_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_evo_rules_updated ON evolution_rules;
CREATE TRIGGER trigger_evo_rules_updated BEFORE UPDATE ON evolution_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
