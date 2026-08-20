import { useState, useEffect, useCallback } from "react";
import { MessageSquareReply, Plus, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type {
  Feedback,
  Case,
  Task,
  FeedbackType,
  SourceType,
  DataStatus,
} from "../types/database";
import {
  FEEDBACK_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  DATA_STATUS_OPTIONS,
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

interface FeedbackProps {
  filterCaseId: string | null;
  onCaseChange: (id: string | null) => void;
}

interface FeedbackWithRelations extends Feedback {
  cases?: { case_name: string } | null;
  tasks?: { task_description: string } | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const initialFormData = {
  case_id: "",
  related_task_id: "",
  feedback_type: "TASK_RESULT" as FeedbackType,
  feedback_content: "",
  observation: "",
  result_status: "",
  generates_new_event: false,
  source_type: "HUMAN_OBSERVED" as SourceType,
  data_status: "RAW" as DataStatus,
};

export function Feedback({ filterCaseId, onCaseChange }: FeedbackProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackWithRelations[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [formTasks, setFormTasks] = useState<Task[]>([]);
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

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("feedback")
      .select("*, cases(case_name), tasks(task_description)")
      .order("created_at", { ascending: false });
    if (filterCaseId) {
      query = query.eq("case_id", filterCaseId);
    }
    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    }
    setFeedbackList((data as FeedbackWithRelations[]) ?? []);
    setLoading(false);
  }, [filterCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Load tasks for the selected case in the form
  useEffect(() => {
    if (!formData.case_id) {
      setFormTasks([]);
      return;
    }
    supabase
      .from("tasks")
      .select("*")
      .eq("case_id", formData.case_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFormTasks((data as Task[]) ?? []);
      });
  }, [formData.case_id]);

  const caseOptions = [
    { value: "", label: "全部案例" },
    ...cases.map((c) => ({ value: c.id, label: c.case_name })),
  ];

  const formCaseOptions = cases.map((c) => ({ value: c.id, label: c.case_name }));
  const formTaskOptions = formTasks.map((t) => ({
    value: t.id,
    label:
      t.task_description.length > 40
        ? t.task_description.slice(0, 40) + "…"
        : t.task_description,
  }));

  const openModal = () => {
    setFormData({
      ...initialFormData,
      case_id: filterCaseId ?? "",
    });
    setFormTasks([]);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.case_id || !formData.related_task_id || !formData.feedback_content.trim()) return;
    setSubmitting(true);
    const { error: insertError } = await supabase.from("feedback").insert({
      case_id: formData.case_id,
      related_task_id: formData.related_task_id,
      feedback_type: formData.feedback_type,
      feedback_content: formData.feedback_content.trim(),
      observation: formData.observation.trim() || null,
      result_status: formData.result_status.trim() || null,
      generates_new_event: formData.generates_new_event,
      source_type: formData.source_type,
      data_status: formData.data_status,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadFeedback();
  };

  return (
    <div>
      <PageHeader
        title="回饋"
        description="管理回饋紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增回饋
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
      ) : feedbackList.length === 0 ? (
        <EmptyState
          icon={MessageSquareReply}
          title="尚無回饋"
          description="點擊「新增回饋」建立第一筆回饋紀錄"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {feedbackList.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquareReply size={16} className="text-rose-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {f.feedback_content}
                    </h3>
                  </div>
                  {f.cases?.case_name && (
                    <p className="text-xs text-neutral-400">
                      {f.cases.case_name}
                    </p>
                  )}
                </div>
                {f.generates_new_event && (
                  <Badge variant="primary">產生新事件</Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                {f.observation && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">觀察：</span>
                    {f.observation}
                  </div>
                )}
                {f.result_status && (
                  <div>
                    <span className="text-neutral-400">結果狀態：</span>
                    {f.result_status}
                  </div>
                )}
                {f.tasks?.task_description && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">關聯任務：</span>
                    {f.tasks.task_description}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">建立：</span>
                  {formatDate(f.created_at)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={statusToBadgeVariant(f.feedback_type)}>
                  {labelFor(FEEDBACK_TYPE_OPTIONS, f.feedback_type)}
                </Badge>
                <Badge variant={statusToBadgeVariant(f.source_type)}>
                  {labelFor(SOURCE_TYPE_OPTIONS, f.source_type)}
                </Badge>
                <Badge variant={statusToBadgeVariant(f.data_status)}>
                  {labelFor(DATA_STATUS_OPTIONS, f.data_status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增回饋"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="所屬案例"
            value={formData.case_id}
            onChange={(v) => {
              update("case_id", v);
              update("related_task_id", "");
            }}
            options={formCaseOptions}
            required
          />
          <Select
            label="關聯任務"
            value={formData.related_task_id}
            onChange={(v) => update("related_task_id", v)}
            options={formTaskOptions}
            required
          />
          <Select
            label="回饋類型"
            value={formData.feedback_type}
            onChange={(v) => update("feedback_type", v as FeedbackType)}
            options={FEEDBACK_TYPE_OPTIONS}
          />
          <Textarea
            label="回饋內容"
            value={formData.feedback_content}
            onChange={(v) => update("feedback_content", v)}
            placeholder="請輸入回饋內容"
            required
            rows={3}
          />
          <Textarea
            label="觀察"
            value={formData.observation}
            onChange={(v) => update("observation", v)}
            placeholder="請輸入觀察"
            rows={2}
          />
          <Input
            label="結果狀態"
            value={formData.result_status}
            onChange={(v) => update("result_status", v)}
            placeholder="請輸入結果狀態"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="來源類型"
              value={formData.source_type}
              onChange={(v) => update("source_type", v as SourceType)}
              options={SOURCE_TYPE_OPTIONS}
            />
            <Select
              label="資料狀態"
              value={formData.data_status}
              onChange={(v) => update("data_status", v as DataStatus)}
              options={DATA_STATUS_OPTIONS}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={formData.generates_new_event}
                onChange={(e) => update("generates_new_event", e.target.checked)}
                className="h-4 w-4 rounded accent-primary-600"
              />
              產生新事件
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立回饋"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
