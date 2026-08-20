import { useState, useEffect } from "react";
import {
  FolderOpen,
  Zap,
  CircleDot,
  CheckSquare,
  MessageSquareReply,
  GitBranch,
  Scale,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Case } from "../types/database";
import { Card } from "../components/Card";
import { Badge, statusToBadgeVariant } from "../components/Badge";
import { PageHeader, LoadingSpinner } from "../components/Common";
import { CONTEXT_MODEL_OPTIONS, CASE_CLOSURE_OPTIONS, labelFor } from "../lib/constants";

interface DashboardProps {
  onNavigate: (page: string) => void;
  onOpenCase: (caseId: string) => void;
}

interface StatItem {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  page: string;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

export function Dashboard({ onNavigate, onOpenCase }: DashboardProps) {
  const [casesCount, setCasesCount] = useState<number | null>(null);
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [tasksCount, setTasksCount] = useState<number | null>(null);
  const [rulesCount, setRulesCount] = useState<number | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [casesRes, eventsRes, tasksRes, rulesRes, recentRes] =
        await Promise.all([
          supabase.from("cases").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("tasks").select("*", { count: "exact", head: true }),
          supabase
            .from("evolution_rules")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("cases")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setCasesCount(casesRes.count);
      setEventsCount(eventsRes.count);
      setTasksCount(tasksRes.count);
      setRulesCount(rulesRes.count);
      setRecentCases((recentRes.data as Case[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const stats: StatItem[] = [
    {
      label: "案例",
      value: casesCount,
      icon: FolderOpen,
      color: "bg-primary-50 text-primary-600",
      page: "cases",
    },
    {
      label: "事件",
      value: eventsCount,
      icon: Zap,
      color: "bg-amber-50 text-amber-600",
      page: "events",
    },
    {
      label: "任務",
      value: tasksCount,
      icon: CheckSquare,
      color: "bg-emerald-50 text-emerald-600",
      page: "tasks",
    },
    {
      label: "演化規則",
      value: rulesCount,
      icon: Scale,
      color: "bg-violet-50 text-violet-600",
      page: "evolution-rules",
    },
  ];

  const pipelineSteps = [
    { label: "事件", icon: Zap, color: "bg-amber-100 text-amber-700" },
    { label: "狀態", icon: CircleDot, color: "bg-sky-100 text-sky-700" },
    { label: "任務", icon: CheckSquare, color: "bg-emerald-100 text-emerald-700" },
    { label: "回饋", icon: MessageSquareReply, color: "bg-rose-100 text-rose-700" },
    { label: "演化候選", icon: GitBranch, color: "bg-violet-100 text-violet-700" },
    { label: "演化規則", icon: Scale, color: "bg-indigo-100 text-indigo-700" },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="儀表板" description="事件結果整合演化模型系統總覽" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="儀表板"
        description="事件結果整合演化模型系統總覽"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-neutral-900">
                    {stat.value ?? "-"}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 資料流程 */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <TrendingUp size={20} className="text-primary-600" />
          資料流程
        </h2>
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-2 lg:gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${step.color}`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="text-xs font-medium text-neutral-600">
                      {step.label}
                    </span>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <ArrowRight
                      size={20}
                      className="text-neutral-300"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 最近案例 */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <FolderOpen size={20} className="text-primary-600" />
            最近案例
          </h2>
          <button
            onClick={() => onNavigate("cases")}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            查看全部 →
          </button>
        </div>
        {recentCases.length === 0 ? (
          <Card className="p-10 text-center text-sm text-neutral-500">
            尚無案例資料
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recentCases.map((c) => (
              <Card key={c.id} onClick={() => onOpenCase(c.id)} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-neutral-900">
                      {c.case_name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                      {c.description || "無描述"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant={statusToBadgeVariant(c.context_model)}>
                    {labelFor(CONTEXT_MODEL_OPTIONS, c.context_model)}
                  </Badge>
                  <Badge variant={statusToBadgeVariant(c.closure_status)}>
                    {labelFor(CASE_CLOSURE_OPTIONS, c.closure_status)}
                  </Badge>
                  <span className="ml-auto text-xs text-neutral-400">
                    {formatDate(c.created_at)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
