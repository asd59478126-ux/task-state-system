export type SourceType = "HUMAN_OBSERVED" | "HUMAN_CONFIRMED" | "SYSTEM_RESULT" | "AI_GENERATED";
export type DataStatus = "RAW" | "UNCONFIRMED" | "CONFIRMED" | "DERIVED";
export type ContextModel = "LIVE_CONVERSATION" | "ARCHIVED_CASE" | "DATASET_IMPORT" | "UNKNOWN";
export type StateLifecycle = "ACTIVE" | "UPDATED" | "COMPLETED" | "ARCHIVED";
export type TaskType = "FORMAL_TASK" | "TASK_CANDIDATE" | "EXPLORATION";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED";
export type FeedbackType = "TASK_RESULT" | "SYSTEM_RESULT" | "HUMAN_EVALUATION" | "UNRESOLVED_RESULT";
export type EvolutionInterfaceStatus = "READY" | "PENDING_PATTERN" | "NOT_AVAILABLE";
export type CaseClosure = "OPEN" | "CLOSED" | "UNKNOWN";

export interface Case {
  id: string;
  case_name: string;
  description: string | null;
  context_model: ContextModel;
  closure_status: CaseClosure;
  boundary_status: string | null;
  boundary_reason: string | null;
  goal: string | null;
  parser_version: string | null;
  schema_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  case_id: string;
  event_time: string | null;
  event_type: string | null;
  actor: string | null;
  target: string | null;
  description: string;
  result: string | null;
  source_type: SourceType;
  data_status: DataStatus;
  related_task_id: string | null;
  created_at: string;
}

export interface State {
  id: string;
  case_id: string;
  related_event_id: string;
  state_type: string | null;
  state_description: string;
  state_evidence: string | null;
  lifecycle_status: StateLifecycle;
  source_type: SourceType;
  data_status: DataStatus;
  version: number;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  case_id: string;
  related_state_id: string;
  task_type: TaskType;
  task_description: string;
  completion_criteria: string | null;
  task_source: string | null;
  task_status: TaskStatus;
  priority: number | null;
  assigned_to: string | null;
  requires_human_review: boolean;
  review_status: string | null;
  data_status: DataStatus;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  case_id: string;
  related_task_id: string;
  feedback_type: FeedbackType;
  feedback_content: string;
  observation: string | null;
  result_status: string | null;
  generates_new_event: boolean;
  source_type: SourceType;
  data_status: DataStatus;
  created_at: string;
}

export interface EvolutionCandidate {
  id: string;
  case_id: string;
  knowledge_context_id: string | null;
  context_model: ContextModel;
  parser_status: string | null;
  evidence_chains: unknown;
  observation_count: number;
  required_additional_cases: number;
  temporal_order: string | null;
  ready_for_evolution_engine: boolean;
  evolution_interface_status: EvolutionInterfaceStatus;
  data_status: DataStatus;
  created_at: string;
  updated_at: string;
}

export interface EvolutionRule {
  id: string;
  rule_name: string;
  source_data: string | null;
  target_category: string | null;
  previous_rule: string | null;
  new_rule: string;
  evidence_chain_ids: string | null;
  observation_count: number | null;
  is_active: boolean;
  version: string;
  data_status: DataStatus;
  created_at: string;
  updated_at: string;
}

export interface ValidationReport {
  id: string;
  case_id: string | null;
  context_model_result: ContextModel | null;
  context_closure_status: string | null;
  event_extraction_result: string | null;
  state_transformation_result: string | null;
  task_transformation_result: string | null;
  feedback_validation_result: string | null;
  evolution_interface_result: string | null;
  blocking_reasons: string | null;
  needs_human_confirm: boolean;
  overall_status: string;
  parser_version: string | null;
  created_at: string;
}
