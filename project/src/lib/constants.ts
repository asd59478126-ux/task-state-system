import type {
  SourceType,
  DataStatus,
  ContextModel,
  StateLifecycle,
  TaskType,
  TaskStatus,
  FeedbackType,
  EvolutionInterfaceStatus,
  CaseClosure,
} from "../types/database";

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "HUMAN_OBSERVED", label: "人類觀察紀錄" },
  { value: "HUMAN_CONFIRMED", label: "人類確認資料" },
  { value: "SYSTEM_RESULT", label: "系統實際結果" },
  { value: "AI_GENERATED", label: "AI 產生之互動紀錄" },
];

export const DATA_STATUS_OPTIONS: { value: DataStatus; label: string }[] = [
  { value: "RAW", label: "原始資料" },
  { value: "UNCONFIRMED", label: "未確認" },
  { value: "CONFIRMED", label: "已確認" },
  { value: "DERIVED", label: "推導資料" },
];

export const CONTEXT_MODEL_OPTIONS: { value: ContextModel; label: string }[] = [
  { value: "LIVE_CONVERSATION", label: "進行中對話" },
  { value: "ARCHIVED_CASE", label: "已歸檔案例" },
  { value: "DATASET_IMPORT", label: "資料集匯入" },
  { value: "UNKNOWN", label: "未知來源" },
];

export const STATE_LIFECYCLE_OPTIONS: { value: StateLifecycle; label: string }[] = [
  { value: "ACTIVE", label: "目前有效" },
  { value: "UPDATED", label: "已更新" },
  { value: "COMPLETED", label: "已完成" },
  { value: "ARCHIVED", label: "已歸檔" },
];

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "FORMAL_TASK", label: "正式任務" },
  { value: "TASK_CANDIDATE", label: "任務候選" },
  { value: "EXPLORATION", label: "探索討論" },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "PENDING", label: "待處理" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "BLOCKED", label: "已阻斷" },
  { value: "CANCELLED", label: "已取消" },
];

export const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "TASK_RESULT", label: "任務結果" },
  { value: "SYSTEM_RESULT", label: "系統結果" },
  { value: "HUMAN_EVALUATION", label: "人類評估" },
  { value: "UNRESOLVED_RESULT", label: "未解決結果" },
];

export const EVOLUTION_STATUS_OPTIONS: {
  value: EvolutionInterfaceStatus;
  label: string;
}[] = [
  { value: "READY", label: "可進入演化引擎" },
  { value: "PENDING_PATTERN", label: "等待模式累積" },
  { value: "NOT_AVAILABLE", label: "尚不具備條件" },
];

export const CASE_CLOSURE_OPTIONS: { value: CaseClosure; label: string }[] = [
  { value: "OPEN", label: "進行中" },
  { value: "CLOSED", label: "已關閉" },
  { value: "UNKNOWN", label: "未知" },
];

export function labelFor(
  options: { value: string; label: string }[],
  value: string | null | undefined
): string {
  if (!value) return "-";
  return options.find((o) => o.value === value)?.label ?? value;
}
