import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, Plus, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { ValidationReport, Case, ContextModel } from "../types/database";
import {
  CONTEXT_MODEL_OPTIONS,
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

interface ValidationReportsProps {
  filterCaseId: string | null;
  onCaseChange: (id: string | null) => void;
}

interface ReportWithCase extends ValidationReport {
  cases?: { case_name: string } | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const initialFormData = {
  case_id: "",
  context_model_result: "" as ContextModel | "",
  context_closure_status: "",
  event_extraction_result: "",
  state_transformation_result: "",
  task_transformation_result: "",
  feedback_validation_result: "",
  evolution_interface_result: "",
  blocking_reasons: "",
  needs_human_confirm: false,
  overall_status: "PASS",
  parser_version: "v1.8",
};

export function ValidationReports({
  filterCaseId,
  onCaseChange,
}: ValidationReportsProps) {
  const [reports, setReports] = useState<ReportWithCase[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
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
    const { data } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });
    setCases((data as Case[]) ?? []);
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("validation_reports")
      .select("*, cases(case_name)")
      .order("created_at", { ascending: false });
    if (filterCaseId) {
      query = query.eq("case_id", filterCaseId);
    }
    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    }
    setReports((data as ReportWithCase[]) ?? []);
    setLoading(false);
  }, [filterCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const caseOptions = [
    { value: "", label: "全部案例" },
    ...cases.map((c) => ({ value: c.id, label: c.case_name })),
  ];

  const contextModelOptionsWithNone = [
    { value: "", label: "未指定" },
    ...CONTEXT_MODEL_OPTIONS,
  ];

  const openModal = () => {
    setFormData({
      ...initialFormData,
      case_id: filterCaseId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error: insertError } = await supabase
      .from("validation_reports")
      .insert({
        case_id: formData.case_id || null,
        context_model_result: formData.context_model_result || null,
        context_closure_status: formData.context_closure_status.trim() || null,
        event_extraction_result:
          formData.event_extraction_result.trim() || null,
        state_transformation_result:
          formData.state_transformation_result.trim() || null,
        task_transformation_result:
          formData.task_transformation_result.trim() || null,
        feedback_validation_result:
          formData.feedback_validation_result.trim() || null,
        evolution_interface_result:
          formData.evolution_interface_result.trim() || null,
        blocking_reasons: formData.blocking_reasons.trim() || null,
        needs_human_confirm: formData.needs_human_confirm,
        overall_status: formData.overall_status.trim() || "PASS",
        parser_version: formData.parser_version.trim() || "v1.8",
      });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadReports();
  };

  return (
    <div>
      <PageHeader
        title="驗證報告"
        description="資料解析驗證結果紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增報告
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-700 ring-1 ring-inset ring-error-200">
          {error}
        </div>
      )}

      {/* Case filter */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Filter size={16} />
          <span>案例篩選</span>
        </div>
        <div className="w-64">
          <Select
            value={filterCaseId ?? ""}
            onChange={(v) => onCaseChange(v || null)}
            options={caseOptions}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="尚無驗證報告"
          description="點擊「新增報告」建立第一份驗證報告"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <ClipboardCheck size={16} className="text-primary-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {r.cases?.case_name || "未關聯案例"}
                    </h3>
                  </div>
                </div>
                <Badge
                  variant={statusToBadgeVariant(r.overall_status)}
                >
                  {r.overall_status}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-xs text-neutral-600">
                {r.context_model_result && (
                  <div>
                    <span className="text-neutral-400">情境模型：</span>
                    <Badge
                      variant={statusToBadgeVariant(r.context_model_result)}
                      className="ml-1"
                    >
                      {labelFor(
                        CONTEXT_MODEL_OPTIONS,
                        r.context_model_result
                      )}
                    </Badge>
                  </div>
                )}
                {r.context_closure_status && (
                  <div>
                    <span className="text-neutral-400">結案狀態：</span>
                    {r.context_closure_status}
                  </div>
                )}
                {r.event_extraction_result && (
                  <div>
                    <span className="text-neutral-400">事件抽取：</span>
                    {r.event_extraction_result}
                  </div>
                )}
                {r.state_transformation_result && (
                  <div>
                    <span className="text-neutral-400">狀態轉換：</span>
                    {r.state_transformation_result}
                  </div>
                )}
                {r.task_transformation_result && (
                  <div>
                    <span className="text-neutral-400">任務轉換：</span>
                    {r.task_transformation_result}
                  </div>
                )}
                {r.feedback_validation_result && (
                  <div>
                    <span className="text-neutral-400">回饋驗證：</span>
                    {r.feedback_validation_result}
                  </div>
                )}
                {r.evolution_interface_result && (
                  <div>
                    <span className="text-neutral-400">演化介面：</span>
                    {r.evolution_interface_result}
                  </div>
                )}
                {r.blocking_reasons && (
                  <div className="rounded-md bg-error-50 px-2 py-1 text-error-700">
                    <span className="font-medium">阻斷原因：</span>
                    {r.blocking_reasons}
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {r.needs_human_confirm && (
                  <Badge variant="warning">需人工確認</Badge>
                )}
                {r.parser_version && (
                  <Badge variant="neutral">{r.parser_version}</Badge>
                )}
                <span className="ml-auto text-xs text-neutral-400">
                  {formatDate(r.created_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增驗證報告"
        size="xl"
      >
        <div className="space-y-4">
          <Select
            label="所屬案例（可選）"
            value={formData.case_id}
            onChange={(v) => update("case_id", v)}
            options={caseOptions}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="情境模型結果"
              value={formData.context_model_result}
              onChange={(v) =>
                update("context_model_result", v as ContextModel | "")
              }
              options={contextModelOptionsWithNone}
            />
            <Input
              label="結案狀態"
              value={formData.context_closure_status}
              onChange={(v) => update("context_closure_status", v)}
              placeholder="例如：OPEN / CLOSED"
            />
          </div>
          <Textarea
            label="事件抽取結果"
            value={formData.event_extraction_result}
            onChange={(v) => update("event_extraction_result", v)}
            placeholder="事件抽取驗證結果"
            rows={2}
          />
          <Textarea
            label="狀態轉換結果"
            value={formData.state_transformation_result}
            onChange={(v) => update("state_transformation_result", v)}
            placeholder="狀態轉換驗證結果"
            rows={2}
          />
          <Textarea
            label="任務轉換結果"
            value={formData.task_transformation_result}
            onChange={(v) => update("task_transformation_result", v)}
            placeholder="任務轉換驗證結果"
            rows={2}
          />
          <Textarea
            label="回饋驗證結果"
            value={formData.feedback_validation_result}
            onChange={(v) => update("feedback_validation_result", v)}
            placeholder="回饋驗證結果"
            rows={2}
          />
          <Textarea
            label="演化介面結果"
            value={formData.evolution_interface_result}
            onChange={(v) => update("evolution_interface_result", v)}
            placeholder="演化介面驗證結果"
            rows={2}
          />
          <Textarea
            label="阻斷原因"
            value={formData.blocking_reasons}
            onChange={(v) => update("blocking_reasons", v)}
            placeholder="若有阻斷，請說明原因"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="整體狀態"
              value={formData.overall_status}
              onChange={(v) => update("overall_status", v)}
              placeholder="PASS / NEED_HUMAN_CONFIRM / BLOCKED"
            />
            <Input
              label="Parser 版本"
              value={formData.parser_version}
              onChange={(v) => update("parser_version", v)}
              placeholder="v1.8"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={formData.needs_human_confirm}
              onChange={(e) =>
                update("needs_human_confirm", e.target.checked)
              }
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            需要人工確認
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立報告"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
