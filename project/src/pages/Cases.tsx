import { useState, useEffect, useCallback } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Case, ContextModel, CaseClosure } from "../types/database";
import {
  CONTEXT_MODEL_OPTIONS,
  CASE_CLOSURE_OPTIONS,
  labelFor,
} from "../lib/constants";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { Input, Textarea, Select } from "../components/Form";
import { Badge, statusToBadgeVariant } from "../components/Badge";
import {
  PageHeader,
  EmptyState,
  LoadingSpinner,
} from "../components/Common";

interface CasesProps {
  onOpenCase: (caseId: string) => void;
}

interface CaseWithCount extends Case {
  event_count?: number;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const initialFormData = {
  case_name: "",
  description: "",
  goal: "",
  context_model: "LIVE_CONVERSATION" as ContextModel,
  closure_status: "OPEN" as CaseClosure,
};

export function Cases({ onOpenCase }: CasesProps) {
  const [cases, setCases] = useState<CaseWithCount[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const update = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const casesData = (data as Case[]) ?? [];
    setCases(casesData);

    // Load event counts per case
    if (casesData.length > 0) {
      const countsMap: Record<string, number> = {};
      await Promise.all(
        casesData.map(async (c) => {
          const { count } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("case_id", c.id);
          countsMap[c.id] = count ?? 0;
        })
      );
      setEventCounts(countsMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const openModal = () => {
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.case_name.trim()) return;
    setSubmitting(true);
    const { error: insertError } = await supabase.from("cases").insert({
      case_name: formData.case_name.trim(),
      description: formData.description.trim() || null,
      goal: formData.goal.trim() || null,
      context_model: formData.context_model,
      closure_status: formData.closure_status,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadCases();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="案例管理" description="管理所有案例事實" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="案例管理"
        description="管理所有案例事實"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增案例
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-700 ring-1 ring-inset ring-error-200">
          {error}
        </div>
      )}

      {cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="尚無案例"
          description="點擊「新增案例」建立第一個案例"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card key={c.id} onClick={() => onOpenCase(c.id)} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-neutral-900">
                  {c.case_name}
                </h3>
                <Badge variant={statusToBadgeVariant(c.closure_status)}>
                  {labelFor(CASE_CLOSURE_OPTIONS, c.closure_status)}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
                {c.description || "無描述"}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={statusToBadgeVariant(c.context_model)}>
                  {labelFor(CONTEXT_MODEL_OPTIONS, c.context_model)}
                </Badge>
                <Badge variant="neutral">
                  事件 {eventCounts[c.id] ?? 0}
                </Badge>
                <span className="ml-auto text-xs text-neutral-400">
                  {formatDate(c.created_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增案例"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="案例名稱"
            value={formData.case_name}
            onChange={(v) => update("case_name", v)}
            placeholder="請輸入案例名稱"
            required
          />
          <Textarea
            label="描述"
            value={formData.description}
            onChange={(v) => update("description", v)}
            placeholder="請輸入案例描述"
            rows={3}
          />
          <Textarea
            label="目標"
            value={formData.goal}
            onChange={(v) => update("goal", v)}
            placeholder="請輸入案例目標"
            rows={2}
          />
          <Select
            label="情境模型"
            value={formData.context_model}
            onChange={(v) => update("context_model", v as ContextModel)}
            options={CONTEXT_MODEL_OPTIONS}
          />
          <Select
            label="結案狀態"
            value={formData.closure_status}
            onChange={(v) => update("closure_status", v as CaseClosure)}
            options={CASE_CLOSURE_OPTIONS}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立案例"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
