import { useState, useEffect, useCallback } from "react";
import { Scale, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { EvolutionRule, DataStatus } from "../types/database";
import { labelFor } from "../lib/constants";
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

interface EvolutionRulesProps {}

const RULE_DATA_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DERIVED", label: "推導資料" },
  { value: "CONFIRMED", label: "已確認" },
];

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-TW");
};

const initialFormData = {
  rule_name: "",
  new_rule: "",
  previous_rule: "",
  target_category: "",
  source_data: "",
  evidence_chain_ids: "",
  observation_count: "0",
  is_active: true,
  version: "v1.0",
  data_status: "DERIVED" as DataStatus,
};

export function EvolutionRules({}: EvolutionRulesProps) {
  const [rules, setRules] = useState<EvolutionRule[]>([]);
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

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("evolution_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    }
    setRules((data as EvolutionRule[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const openModal = () => {
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.rule_name.trim() || !formData.new_rule.trim()) return;
    setSubmitting(true);
    const { error: insertError } = await supabase.from("evolution_rules").insert({
      rule_name: formData.rule_name.trim(),
      new_rule: formData.new_rule.trim(),
      previous_rule: formData.previous_rule.trim() || null,
      target_category: formData.target_category.trim() || null,
      source_data: formData.source_data.trim() || null,
      evidence_chain_ids: formData.evidence_chain_ids.trim() || null,
      observation_count: formData.observation_count
        ? Number(formData.observation_count)
        : null,
      is_active: formData.is_active,
      version: formData.version.trim() || "v1.0",
      data_status: formData.data_status,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadRules();
  };

  return (
    <div>
      <PageHeader
        title="演化規則"
        description="管理演化規則紀錄"
        action={
          <Button onClick={openModal}>
            <Plus size={16} />
            新增規則
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-700 ring-1 ring-inset ring-error-200">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="尚無演化規則"
          description="點擊「新增規則」建立第一筆演化規則"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rules.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Scale size={16} className="text-indigo-500" />
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {r.rule_name}
                    </h3>
                  </div>
                </div>
                <Badge variant={r.is_active ? "success" : "neutral"}>
                  {r.is_active ? "啟用" : "停用"}
                </Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs text-neutral-600">
                <div>
                  <span className="text-neutral-400">新規則：</span>
                  <p className="mt-0.5 whitespace-pre-wrap rounded bg-neutral-50 p-2 text-neutral-700">
                    {r.new_rule}
                  </p>
                </div>
                {r.previous_rule && (
                  <div>
                    <span className="text-neutral-400">前版規則：</span>
                    <p className="mt-0.5 whitespace-pre-wrap rounded bg-neutral-50 p-2 text-neutral-700">
                      {r.previous_rule}
                    </p>
                  </div>
                )}
                {r.target_category && (
                  <div>
                    <span className="text-neutral-400">目標分類：</span>
                    {r.target_category}
                  </div>
                )}
                {r.source_data && (
                  <div>
                    <span className="text-neutral-400">來源資料：</span>
                    {r.source_data}
                  </div>
                )}
                {r.evidence_chain_ids && (
                  <div>
                    <span className="text-neutral-400">證據鏈 ID：</span>
                    {r.evidence_chain_ids}
                  </div>
                )}
                <div className="flex gap-4">
                  {r.observation_count !== null && (
                    <span>
                      <span className="text-neutral-400">觀察次數：</span>
                      {r.observation_count}
                    </span>
                  )}
                  <span>
                    <span className="text-neutral-400">建立：</span>
                    {formatDate(r.created_at)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="primary">{r.version}</Badge>
                <Badge variant={statusToBadgeVariant(r.data_status)}>
                  {labelFor(RULE_DATA_STATUS_OPTIONS, r.data_status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增演化規則"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="規則名稱"
            value={formData.rule_name}
            onChange={(v) => update("rule_name", v)}
            placeholder="請輸入規則名稱"
            required
          />
          <Textarea
            label="新規則"
            value={formData.new_rule}
            onChange={(v) => update("new_rule", v)}
            placeholder="請輸入新規則內容"
            required
            rows={4}
          />
          <Textarea
            label="前版規則"
            value={formData.previous_rule}
            onChange={(v) => update("previous_rule", v)}
            placeholder="請輸入前版規則內容"
            rows={3}
          />
          <Input
            label="目標分類"
            value={formData.target_category}
            onChange={(v) => update("target_category", v)}
            placeholder="請輸入目標分類"
          />
          <Textarea
            label="來源資料"
            value={formData.source_data}
            onChange={(v) => update("source_data", v)}
            placeholder="請輸入來源資料"
            rows={2}
          />
          <Input
            label="證據鏈 ID"
            value={formData.evidence_chain_ids}
            onChange={(v) => update("evidence_chain_ids", v)}
            placeholder="請輸入證據鏈 ID"
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
              label="版本"
              value={formData.version}
              onChange={(v) => update("version", v)}
              placeholder="v1.0"
            />
          </div>
          <Select
            label="資料狀態"
            value={formData.data_status}
            onChange={(v) => update("data_status", v as DataStatus)}
            options={RULE_DATA_STATUS_OPTIONS}
          />
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => update("is_active", e.target.checked)}
                className="h-4 w-4 rounded accent-primary-600"
              />
              啟用此規則
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "儲存中…" : "建立規則"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
