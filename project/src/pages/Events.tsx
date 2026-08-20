import { useState, useEffect, useCallback } from "react";
import { Zap, Plus, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Event, Case, SourceType, DataStatus } from "../types/database";
import {
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

interface EventsProps {
  filterCaseId: string | null;
  onCaseChange: (id: string | null) => void;
}

interface EventWithCase extends Event {
  cases?: { case_name: string } | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const initialFormData = {
  case_id: "",
  event_time: "",
  event_type: "",
  actor: "",
  target: "",
  description: "",
  result: "",
  source_type: "HUMAN_OBSERVED" as SourceType,
  data_status: "RAW" as DataStatus,
};

export function Events({ filterCaseId, onCaseChange }: EventsProps) {
  const [events, setEvents] = useState<EventWithCase[]>([]);
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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("events")
      .select("*, cases(case_name)")
      .order("created_at", { ascending: false });
    if (filterCaseId) {
      query = query.eq("case_id", filterCaseId);
    }
    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    }
    setEvents((data as EventWithCase[]) ?? []);
    setLoading(false);
  }, [filterCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const caseOptions = [
    { value: "", label: "全部案例" },
    ...cases.map((c) => ({ value: c.id, label: c.case_name })),
  ];

  const openModal = () => {
    setFormData({
      ...initialFormData,
      case_id: filterCaseId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.case_id || !formData.description.trim()) return;
    setSubmitting(true);
    const { error: insertError } = await supabase.from("events").insert({
      case_id: formData.case_id,
      event_time: formData.event_time
        ? new Date(formData.event_time).toISOString()
        : null,
      event_type: formData.event_type.trim() || null,
      actor: formData.actor.trim() || null,
      target: formData.target.trim() || null,
      description: formData.description.trim(),
      result: formData.result.trim() || null,
      source_type: formData.source_type,
      data_status: formData.data_status,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadEvents();
  };

  return (
    <div>
      <PageHeader
        title="事件"
        description="管理事件紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增事件
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
      ) : events.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="尚無事件"
          description="點擊「新增事件」建立第一筆事件紀錄"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {e.description}
                    </h3>
                  </div>
                  {e.cases?.case_name && (
                    <p className="text-xs text-neutral-400">
                      {e.cases.case_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                {e.event_type && (
                  <div>
                    <span className="text-neutral-400">類型：</span>
                    {e.event_type}
                  </div>
                )}
                {e.actor && (
                  <div>
                    <span className="text-neutral-400">行為者：</span>
                    {e.actor}
                  </div>
                )}
                {e.target && (
                  <div>
                    <span className="text-neutral-400">目標：</span>
                    {e.target}
                  </div>
                )}
                {e.result && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">結果：</span>
                    {e.result}
                  </div>
                )}
                {e.event_time && (
                  <div>
                    <span className="text-neutral-400">事件時間：</span>
                    {formatDate(e.event_time)}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">建立：</span>
                  {formatDate(e.created_at)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={statusToBadgeVariant(e.source_type)}>
                  {labelFor(SOURCE_TYPE_OPTIONS, e.source_type)}
                </Badge>
                <Badge variant={statusToBadgeVariant(e.data_status)}>
                  {labelFor(DATA_STATUS_OPTIONS, e.data_status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增事件"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="所屬案例"
            value={formData.case_id}
            onChange={(v) => update("case_id", v)}
            options={caseOptions.filter((o) => o.value !== "")}
            required
          />
          <Input
            label="事件時間"
            type="datetime-local"
            value={formData.event_time}
            onChange={(v) => update("event_time", v)}
          />
          <Input
            label="事件類型"
            value={formData.event_type}
            onChange={(v) => update("event_type", v)}
            placeholder="請輸入事件類型"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="行為者"
              value={formData.actor}
              onChange={(v) => update("actor", v)}
              placeholder="請輸入行為者"
            />
            <Input
              label="目標"
              value={formData.target}
              onChange={(v) => update("target", v)}
              placeholder="請輸入目標"
            />
          </div>
          <Textarea
            label="描述"
            value={formData.description}
            onChange={(v) => update("description", v)}
            placeholder="請輸入事件描述"
            required
            rows={3}
          />
          <Textarea
            label="結果"
            value={formData.result}
            onChange={(v) => update("result", v)}
            placeholder="請輸入事件結果"
            rows={2}
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立事件"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
