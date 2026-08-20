import { useState, useEffect, useCallback } from "react";
import { GitBranch, Plus, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type {
  EvolutionCandidate,
  Case,
  ContextModel,
  EvolutionInterfaceStatus,
  DataStatus,
} from "../types/database";
import {
  EVOLUTION_STATUS_OPTIONS,
  CONTEXT_MODEL_OPTIONS,
  labelFor,
} from "../lib/constants";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { Input, Select } from "../components/Form";
import { Badge, statusToBadgeVariant } from "../components/Badge";
import {
  PageHeader,
  EmptyState,
  LoadingSpinner,
} from "../components/Common";

interface EvolutionCandidatesProps {
  filterCaseId: string | null;
  onCaseChange: (id: string | null) => void;
}

interface CandidateWithCase extends EvolutionCandidate {
  cases?: { case_name: string } | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const CANDIDATE_DATA_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "UNCONFIRMED", label: "未確認" },
  { value: "CONFIRMED", label: "已確認" },
];

const initialFormData = {
  case_id: "",
  knowledge_context_id: "",
  context_model: "LIVE_CONVERSATION" as ContextModel,
  parser_status: "",
  observation_count: "0",
  required_additional_cases: "1",
  temporal_order: "",
  ready_for_evolution_engine: false,
  evolution_interface_status: "NOT_AVAILABLE" as EvolutionInterfaceStatus,
  data_status: "UNCONFIRMED" as DataStatus,
};

export function EvolutionCandidates({
  filterCaseId,
  onCaseChange,
}: EvolutionCandidatesProps) {
  const [candidates, setCandidates] = useState<CandidateWithCase[]>([]);
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

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("evolution_candidates")
      .select("*, cases(case_name)")
      .order("created_at", { ascending: false });
    if (filterCaseId) {
      query = query.eq("case_id", filterCaseId);
    }
    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    }
    setCandidates((data as CandidateWithCase[]) ?? []);
    setLoading(false);
  }, [filterCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const caseOptions = [
    { value: "", label: "全部案例" },
    ...cases.map((c) => ({ value: c.id, label: c.case_name })),
  ];

  const formCaseOptions = cases.map((c) => ({ value: c.id, label: c.case_name }));

  const openModal = () => {
    setFormData({
      ...initialFormData,
      case_id: filterCaseId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.case_id) return;
    setSubmitting(true);
    const { error: insertError } = await supabase
      .from("evolution_candidates")
      .insert({
        case_id: formData.case_id,
        knowledge_context_id: formData.knowledge_context_id.trim() || null,
        context_model: formData.context_model,
        parser_status: formData.parser_status.trim() || null,
        observation_count: Number(formData.observation_count) || 0,
        required_additional_cases: Number(formData.required_additional_cases) || 1,
        temporal_order: formData.temporal_order.trim() || null,
        ready_for_evolution_engine: formData.ready_for_evolution_engine,
        evolution_interface_status: formData.evolution_interface_status,
        data_status: formData.data_status,
      });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadCandidates();
  };

  return (
    <div>
      <PageHeader
        title="演化候選介面"
        description="管理演化候選紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增候選
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
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="尚無演化候選"
          description="點擊「新增候選」建立第一筆演化候選紀錄"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {candidates.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <GitBranch size={16} className="text-violet-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {c.cases?.case_name ?? "未指定案例"}
                    </h3>
                  </div>
                  {c.knowledge_context_id && (
                    <p className="text-xs text-neutral-400">
                      知識情境 ID：{c.knowledge_context_id}
                    </p>
                  )}
                </div>
                <Badge
                  variant={c.ready_for_evolution_engine ? "success" : "neutral"}
                >
                  {c.ready_for_evolution_engine ? "已就緒" : "未就緒"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                {c.parser_status && (
                  <div>
                    <span className="text-neutral-400">解析器狀態：</span>
                    {c.parser_status}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">觀察次數：</span>
                  {c.observation_count}
                </div>
                <div>
                  <span className="text-neutral-400">需額外案例：</span>
                  {c.required_additional_cases}
                </div>
                {c.temporal_order && (
                  <div>
                    <span className="text-neutral-400">時序：</span>
                    {c.temporal_order}
                  </div>
                )}
                <div>
                  <span className="text-neutral-400">建立：</span>
                  {formatDate(c.created_at)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={statusToBadgeVariant(c.context_model)}>
                  {labelFor(CONTEXT_MODEL_OPTIONS, c.context_model)}
                </Badge>
                <Badge
                  variant={statusToBadgeVariant(c.evolution_interface_status)}
                >
                  {labelFor(EVOLUTION_STATUS_OPTIONS, c.evolution_interface_status)}
                </Badge>
                <Badge variant={statusToBadgeVariant(c.data_status)}>
                  {labelFor(CANDIDATE_DATA_STATUS_OPTIONS, c.data_status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增演化候選"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="所屬案例"
            value={formData.case_id}
            onChange={(v) => update("case_id", v)}
            options={formCaseOptions}
            required
          />
          <Input
            label="知識情境 ID"
            value={formData.knowledge_context_id}
            onChange={(v) => update("knowledge_context_id", v)}
            placeholder="請輸入知識情境 ID"
          />
          <Select
            label="情境模型"
            value={formData.context_model}
            onChange={(v) => update("context_model", v as ContextModel)}
            options={CONTEXT_MODEL_OPTIONS}
          />
          <Input
            label="解析器狀態"
            value={formData.parser_status}
            onChange={(v) => update("parser_status", v)}
            placeholder="請輸入解析器狀態"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="觀察次數"
              type="number"
              value={formData.observation_count}
              onChange={(v) => update("observation_count", v)}
              placeholder="0"
            />
            <Input
              label="需額外案例數"
              type="number"
              value={formData.required_additional_cases}
              onChange={(v) => update("required_additional_cases", v)}
              placeholder="1"
            />
          </div>
          <Input
            label="時序"
            value={formData.temporal_order}
            onChange={(v) => update("temporal_order", v)}
            placeholder="請輸入時序"
          />
          <Select
            label="演化介面狀態"
            value={formData.evolution_interface_status}
            onChange={(v) =>
              update("evolution_interface_status", v as EvolutionInterfaceStatus)
            }
            options={EVOLUTION_STATUS_OPTIONS}
          />
          <Select
            label="資料狀態"
            value={formData.data_status}
            onChange={(v) => update("data_status", v as DataStatus)}
            options={CANDIDATE_DATA_STATUS_OPTIONS}
          />
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={formData.ready_for_evolution_engine}
                onChange={(e) =>
                  update("ready_for_evolution_engine", e.target.checked)
                }
                className="h-4 w-4 rounded accent-primary-600"
              />
              可進入演化引擎
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立候選"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
