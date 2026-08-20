import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  CircleDot,
  CheckSquare,
  MessageSquareReply,
  GitBranch,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Case } from "../types/database";
import {
  CONTEXT_MODEL_OPTIONS,
  CASE_CLOSURE_OPTIONS,
  labelFor,
} from "../lib/constants";
import { Card } from "../components/Card";
import { Badge, statusToBadgeVariant } from "../components/Badge";
import { Button } from "../components/Button";
import {
  PageHeader,
  LoadingSpinner,
} from "../components/Common";

interface CaseDetailProps {
  caseId: string;
  onNavigate: (page: string) => void;
}

interface CountInfo {
  events: number;
  states: number;
  tasks: number;
  feedback: number;
  evolution_candidates: number;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

export function CaseDetail({ caseId, onNavigate }: CaseDetailProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [counts, setCounts] = useState<CountInfo>({
    events: 0,
    states: 0,
    tasks: 0,
    feedback: 0,
    evolution_candidates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("找不到此案例");
      setLoading(false);
      return;
    }

    setCaseData(data as Case);

    const [eventsRes, statesRes, tasksRes, feedbackRes, candidatesRes] =
      await Promise.all([
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("case_id", caseId),
        supabase
          .from("states")
          .select("*", { count: "exact", head: true })
          .eq("case_id", caseId),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("case_id", caseId),
        supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .eq("case_id", caseId),
        supabase
          .from("evolution_candidates")
          .select("*", { count: "exact", head: true })
          .eq("case_id", caseId),
      ]);

    setCounts({
      events: eventsRes.count ?? 0,
      states: statesRes.count ?? 0,
      tasks: tasksRes.count ?? 0,
      feedback: feedbackRes.count ?? 0,
      evolution_candidates: candidatesRes.count ?? 0,
    });
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  if (loading) {
    return (
      <div>
        <PageHeader title="案例詳情" />
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div>
        <PageHeader title="案例詳情" />
        <Card className="p-10 text-center">
          <p className="text-sm text-error-600">
            {error ?? "找不到此案例"}
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => onNavigate("cases")}
          >
            返回案例列表
          </Button>
        </Card>
      </div>
    );
  }

  const statCards: {
    label: string;
    value: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    page: string;
    color: string;
  }[] = [
    {
      label: "事件",
      value: counts.events,
      icon: Zap,
      page: "events",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "狀態",
      value: counts.states,
      icon: CircleDot,
      page: "states",
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "任務",
      value: counts.tasks,
      icon: CheckSquare,
      page: "tasks",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "回饋",
      value: counts.feedback,
      icon: MessageSquareReply,
      page: "feedback",
      color: "bg-rose-50 text-rose-600",
    },
    {
      label: "演化候選",
      value: counts.evolution_candidates,
      icon: GitBranch,
      page: "evolution-candidates",
      color: "bg-violet-50 text-violet-600",
    },
  ];

  const chainLinks: { label: string; page: string }[] = [
    { label: "查看事件", page: "events" },
    { label: "查看狀態", page: "states" },
    { label: "查看任務", page: "tasks" },
    { label: "查看回饋", page: "feedback" },
    { label: "查看演化候選", page: "evolution-candidates" },
  ];

  return (
    <div>
      <PageHeader title={caseData.case_name} description="案例完整資訊與資料鏈" />

      {/* Case info card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              案例名稱
            </p>
            <p className="mt-1 text-base font-semibold text-neutral-900">
              {caseData.case_name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              建立日期
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-700">
              <Calendar size={16} className="text-neutral-400" />
              {formatDate(caseData.created_at)}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              描述
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {caseData.description || "無"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              目標
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {caseData.goal || "無"}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              情境模型 / 結案狀態
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant={statusToBadgeVariant(caseData.context_model)}>
                {labelFor(CONTEXT_MODEL_OPTIONS, caseData.context_model)}
              </Badge>
              <Badge variant={statusToBadgeVariant(caseData.closure_status)}>
                {labelFor(CASE_CLOSURE_OPTIONS, caseData.closure_status)}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              邊界狀態
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {caseData.boundary_status || "無"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              邊界原因
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {caseData.boundary_reason || "無"}
            </p>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-neutral-500">
                {stat.label}
              </p>
            </Card>
          );
        })}
      </div>

      {/* 資料鏈 */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">資料鏈</h2>
        <Card className="p-5">
          <div className="flex flex-wrap gap-3">
            {chainLinks.map((link) => (
              <Button
                key={link.page}
                variant="secondary"
                onClick={() => onNavigate(link.page)}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
