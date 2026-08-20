import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Plus, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type {
  Task,
  Case,
  State,
  TaskType,
  TaskStatus,
  DataStatus,
} from "../types/database";
import {
  TASK_TYPE_OPTIONS,
  TASK_STATUS_OPTIONS,
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

interface TasksProps {
  filterCaseId: string | null;
  onCaseChange: (id: string | null) => void;
}

interface TaskWithRelations extends Task {
  cases?: { case_name: string } | null;
  states?: { state_description: string } | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const initialFormData = {
  case_id: "",
  related_state_id: "",
  task_type: "FORMAL_TASK" as TaskType,
  task_description: "",
  completion_criteria: "",
  task_source: "",
  task_status: "PENDING" as TaskStatus,
  priority: "1",
  assigned_to: "",
  requires_human_review: false,
  data_status: "RAW" as DataStatus,
};

export function Tasks({ filterCaseId, onCaseChange }: TasksProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [formStates, setFormStates] = useState<State[]>([]);
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

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("tasks")
      .select("*, cases(case_name), states(state_description)")
      .order("created_at", { ascending: false });
    if (filterCaseId) {
      query = query.eq("case_id", filterCaseId);
    }
    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    }
    setTasks((data as TaskWithRelations[]) ?? []);
    setLoading(false);
  }, [filterCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Load states for the selected case in the form
  useEffect(() => {
    if (!formData.case_id) {
      setFormStates([]);
      return;
    }
    supabase
      .from("states")
      .select("*")
      .eq("case_id", formData.case_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFormStates((data as State[]) ?? []);
      });
  }, [formData.case_id]);

  const caseOptions = [
    { value: "", label: "全部案例" },
    ...cases.map((c) => ({ value: c.id, label: c.case_name })),
  ];

  const formCaseOptions = cases.map((c) => ({ value: c.id, label: c.case_name }));
  const formStateOptions = formStates.map((s) => ({
    value: s.id,
    label:
      s.state_description.length > 40
        ? s.state_description.slice(0, 40) + "…"
        : s.state_description,
  }));

  const openModal = () => {
    setFormData({
      ...initialFormData,
      case_id: filterCaseId ?? "",
    });
    setFormStates([]);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.case_id || !formData.related_state_id || !formData.task_description.trim()) return;
    setSubmitting(true);
    const { error: insertError } = await supabase.from("tasks").insert({
      case_id: formData.case_id,
      related_state_id: formData.related_state_id,
      task_type: formData.task_type,
      task_description: formData.task_description.trim(),
      completion_criteria: formData.completion_criteria.trim() || null,
      task_source: formData.task_source.trim() || null,
      task_status: formData.task_status,
      priority: formData.priority ? Number(formData.priority) : null,
      assigned_to: formData.assigned_to.trim() || null,
      requires_human_review: formData.requires_human_review,
      data_status: formData.data_status,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadTasks();
  };

  return (
    <div>
      <PageHeader
        title="任務"
        description="管理任務紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增任務
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
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="尚無任務"
          description="點擊「新增任務」建立第一筆任務紀錄"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {tasks.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckSquare size={16} className="text-emerald-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {t.task_description}
                    </h3>
                  </div>
                  {t.cases?.case_name && (
                    <p className="text-xs text-neutral-400">
                      {t.cases.case_name}
                    </p>
                  )}
                </div>
                {t.requires_human_review && (
                  <Badge variant="warning">需人工審核</Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                {t.completion_criteria && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">完成標準：</span>
                    {t.completion_criteria}
                  </div>
                )}
                {t.priority !== null && (
                  <div>
                    <span className="text-neutral-400">優先級：</span>
                    {t.priority}
                  </div>
                )}
                {t.assigned_to && (
                  <div>
                    <span className="text-neutral-400">指派：</span>
                    {t.assigned_to}
                  </div>
                )}
                {t.states?.state_description && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">關聯狀態：</span>
                    {t.states.state_description}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">建立：</span>
                  {formatDate(t.created_at)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={statusToBadgeVariant(t.task_type)}>
                  {labelFor(TASK_TYPE_OPTIONS, t.task_type)}
                </Badge>
                <Badge variant={statusToBadgeVariant(t.task_status)}>
                  {labelFor(TASK_STATUS_OPTIONS, t.task_status)}
                </Badge>
                <Badge variant={statusToBadgeVariant(t.data_status)}>
                  {labelFor(DATA_STATUS_OPTIONS, t.data_status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增任務"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="所屬案例"
            value={formData.case_id}
            onChange={(v) => {
              update("case_id", v);
              update("related_state_id", "");
            }}
            options={formCaseOptions}
            required
          />
          <Select
            label="關聯狀態"
            value={formData.related_state_id}
            onChange={(v) => update("related_state_id", v)}
            options={formStateOptions}
            required
          />
          <Select
            label="任務類型"
            value={formData.task_type}
            onChange={(v) => update("task_type", v as TaskType)}
            options={TASK_TYPE_OPTIONS}
          />
          <Textarea
            label="任務描述"
            value={formData.task_description}
            onChange={(v) => update("task_description", v)}
            placeholder="請輸入任務描述"
            required
            rows={3}
          />
          <Textarea
            label="完成標準"
            value={formData.completion_criteria}
            onChange={(v) => update("completion_criteria", v)}
            placeholder="請輸入完成標準"
            rows={2}
          />
          <Input
            label="任務來源"
            value={formData.task_source}
            onChange={(v) => update("task_source", v)}
            placeholder="請輸入任務來源"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="任務狀態"
              value={formData.task_status}
              onChange={(v) => update("task_status", v as TaskStatus)}
              options={TASK_STATUS_OPTIONS}
            />
            <Input
              label="優先級"
              type="number"
              value={formData.priority}
              onChange={(v) => update("priority", v)}
              placeholder="1"
            />
          </div>
          <Input
            label="指派給"
            value={formData.assigned_to}
            onChange={(v) => update("assigned_to", v)}
            placeholder="請輸入指派對象"
          />
          <Select
            label="資料狀態"
            value={formData.data_status}
            onChange={(v) => update("data_status", v as DataStatus)}
            options={DATA_STATUS_OPTIONS}
          />
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={formData.requires_human_review}
                onChange={(e) => update("requires_human_review", e.target.checked)}
                className="h-4 w-4 rounded accent-primary-600"
              />
              需要人工審核
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立任務"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
