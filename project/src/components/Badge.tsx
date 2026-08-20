import { clsx } from "./clsx";

type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "accent";

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-50 text-primary-700 ring-primary-200",
  success: "bg-success-50 text-success-700 ring-success-500/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-500/20",
  error: "bg-error-50 text-error-700 ring-error-500/20",
  neutral: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-500/20",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusToBadgeVariant(
  status: string
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    ACTIVE: "success",
    CONFIRMED: "success",
    COMPLETED: "success",
    READY: "success",
    UPDATED: "primary",
    IN_PROGRESS: "primary",
    PENDING: "warning",
    PENDING_PATTERN: "warning",
    UNCONFIRMED: "warning",
    RAW: "neutral",
    BLOCKED: "error",
    NOT_AVAILABLE: "error",
    ARCHIVED: "neutral",
    CANCELLED: "neutral",
    EXPLORATION: "neutral",
    TASK_CANDIDATE: "warning",
    FORMAL_TASK: "primary",
    CLOSED: "neutral",
    OPEN: "success",
    UNKNOWN: "error",
    PASS: "success",
    DERIVED: "accent",
    HUMAN_OBSERVED: "primary",
    HUMAN_CONFIRMED: "success",
    SYSTEM_RESULT: "accent",
    AI_GENERATED: "warning",
    LIVE_CONVERSATION: "primary",
    ARCHIVED_CASE: "success",
    DATASET_IMPORT: "accent",
    NEED_HUMAN_CONFIRM: "error",
    CONTEXT_INSUFFICIENT: "error",
    INFERENCE_RISK: "error",
  };
  return map[status] ?? "neutral";
}
