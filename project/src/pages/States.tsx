import { useState, useEffect, useCallback } from "react";
import { CircleDot, Plus, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type {
  State,
  Case,
  Event,
  StateLifecycle,
  SourceType,
  DataStatus,
} from "../types/database";
import {
  STATE_LIFECYCLE_OPTIONS,
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

interface StatesProps {
  filterCaseId: string | null;
  onCaseChange: (id: string | null) => void;
}

interface StateWithRelations extends State {
  cases?: { case_name: string } | null;
  events?: { description: string } | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const initialFormData = {
  case_id: "",
  related_event_id: "",
  state_type: "",
  state_description: "",
  state_evidence: "",
  lifecycle_status: "ACTIVE" as StateLifecycle,
  source_type: "HUMAN_OBSERVED" as SourceType,
  data_status: "RAW" as DataStatus,
};

export function States({ filterCaseId, onCaseChange }: StatesProps) {
  const [states, setStates] = useState<StateWithRelations[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [formEvents, setFormEvents] = useState<Event[]>([]);
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

  const loadStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("states")
      .select("*, cases(case_name), events(description)")
      .order("created_at", { ascending: false });
    if (filterCaseId) {
      query = query.eq("case_id", filterCaseId);
    }
    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    }
    setStates((data as StateWithRelations[]) ?? []);
    setLoading(false);
  }, [filterCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  // Load events for the selected case in the form
  useEffect(() => {
    if (!formData.case_id) {
      setFormEvents([]);
      return;
    }
    supabase
      .from("events")
      .select("*")
      .eq("case_id", formData.case_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFormEvents((data as Event[]) ?? []);
      });
  }, [formData.case_id]);

  const caseOptions = [
    { value: "", label: "全部案例" },
    ...cases.map((c) => ({ value: c.id, label: c.case_name })),
  ];

  const formCaseOptions = cases.map((c) => ({ value: c.id, label: c.case_name }));
  const formEventOptions = formEvents.map((e) => ({
    value: e.id,
    label: e.description.length > 40 ? e.description.slice(0, 40) + "…" : e.description,
  }));

  const openModal = () => {
    setFormData({
      ...initialFormData,
      case_id: filterCaseId ?? "",
    });
    setFormEvents([]);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.case_id || !formData.related_event_id || !formData.state_description.trim()) return;
    setSubmitting(true);
    const { error: insertError } = await supabase.from("states").insert({
      case_id: formData.case_id,
      related_event_id: formData.related_event_id,
      state_type: formData.state_type.trim() || null,
      state_description: formData.state_description.trim(),
      state_evidence: formData.state_evidence.trim() || null,
      lifecycle_status: formData.lifecycle_status,
      source_type: formData.source_type,
      data_status: formData.data_status,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadStates();
  };

  return (
    <div>
      <PageHeader
        title="狀態"
        description="管理狀態紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增狀態
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
      ) : states.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title="尚無狀態"
          description="點擊「新增狀態」建立第一筆狀態紀錄"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {states.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <CircleDot size={16} className="text-sky-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {s.state_description}
                    </h3>
                  </div>
                  {s.cases?.case_name && (
                    <p className="text-xs text-neutral-400">
                      {s.cases.case_name}
                    </p>
                  )}
                </div>
                {s.is_latest && (
                  <Badge variant="success">最新</Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                {s.state_type && (
                  <div>
                    <span className="text-neutral-400">類型：</span>
                    {s.state_type}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">版本：</span>
                  {s.version}
                </div>
                {s.state_evidence && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">證據：</span>
                    {s.state_evidence}
                  </div>
                )}
                {s.events?.description && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">關聯事件：</span>
                    {s.events.description}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">建立：</span>
                  {formatDate(s.created_at)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={statusToBadgeVariant(s.lifecycle_status)}>
                  {labelFor(STATE_LIFECYCLE_OPTIONS, s.lifecycle_status)}
                </Badge>
                <Badge variant={statusToBadgeVariant(s.source_type)}>
                  {labelFor(SOURCE_TYPE_OPTIONS, s.source_type)}
                </Badge>
                <Badge variant={statusToBadgeVariant(s.data_status)}>
                  {labelFor(DATA_STATUS_OPTIONS, s.data_status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增狀態"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="所屬案例"
            value={formData.case_id}
            onChange={(v) => {
              update("case_id", v);
              update("related_event_id", "");
            }}
            options={formCaseOptions}
            required
          />
          <Select
            label="關聯事件"
            value={formData.related_event_id}
            onChange={(v) => update("related_event_id", v)}
            options={formEventOptions}
            required
          />
          <Input
            label="狀態類型"
            value={formData.state_type}
            onChange={(v) => update("state_type", v)}
            placeholder="請輸入狀態類型"
          />
          <Textarea
            label="狀態描述"
            value={formData.state_description}
            onChange={(v) => update("state_description", v)}
            placeholder="請輸入狀態描述"
            required
            rows={3}
          />
          <Textarea
            label="狀態證據"
            value={formData.state_evidence}
            onChange={(v) => update("state_evidence", v)}
            placeholder="請輸入狀態證據"
            rows={2}
          />
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="生命週期狀態"
              value={formData.lifecycle_status}
              onChange={(v) => update("lifecycle_status", v as StateLifecycle)}
              options={STATE_LIFECYCLE_OPTIONS}
            />
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立狀態"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
