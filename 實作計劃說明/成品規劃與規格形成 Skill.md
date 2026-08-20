# 成品規劃與規格形成 Skill

> 目的：讓企劃（產品/需求端）與技術（實作端與驗證端）在同一套可執行、可追溯、可驗證的規格形成與規格外處理流程下協作。此文件同時作為 AI 生成規格時的行為與驗證約定（AI output contract）。

## TL;DR（快速導覽）
- 規格（Spec）定義：在進入製作前對可判定內容的正式固定（意圖、必要條件、驗證方式）。
- 測試總集（Test Suite Collection）：由實作啟動後、基於實際中繼/執行資料所歸納出的檢查集合；第一版應由第一次實作觀察產出。
- 規格外（Out-of-spec）：在製作/驗證/運行中發現，未被現有規格充分描述或判定的現象。發現後必先判定（分類/影響/決策），再決定回流或保留。
- AI 規則：AI 輸出必須標示來源、可信度、輸出狀態（no_data/conflict/candidate/verified）與驗證建議；不得憑空補完成已定案。

---

## 1. 總體目標
- 降低在製作階段才暴露的規格外比例。
- 建立一套「觀察驅動」的測試與判定流程：從第一次實作中收集中繼，產生規格外清單，經人工判定後形成可執行的測試總集。
- 讓 AI 的規格輸出可驗證、可追溯，不會把推測當定案。

---

## 2. 核心定義（重點回顧）
- 規劃：結構化理解與判定成品的工作。
- 規格：規劃階段形成的正式、可引用、可判定內容（含驗證方式）。
- 製作：實作/測試/運行，讓規格接受現實檢驗。
- 規格外：製作或運行中出現，未被規格充分描述或判定的現象。需分類與判定。
- 測試總集：實作階段觀察後產生、已被判定為需持續檢測的檢查項集合。

---

## 3. 你提出的核心觀點（確認與價值）
你的想法要點：
- 規格與測試總集應該分層：規格定義意圖與必要欄位；測試總集由實作觀察產生。
- AI 與人都不得憑空填補缺失：若無資料輸出「no_data」，若來源互衝輸出"conflict"。
- 第一次實作產生的中繼檔是生成第一版測試總集的根據。

評價：非常正確且務實。這種「觀察驅動」方法能有效避免提前假設導致的規則謬誤與驗證盲點。

---

## 4. 將原則執行化：必要構件
要把文件從「原則」轉成「可執行 Skill / 團隊流程」，必須補足下列可操作化項目：
- Metadata（title/version/owner/適用範圍）。
- 觸發器（Triggers）：例如製作啟動、PR 包含 AI 生成檔、CI 測試失敗等。
- 前置條件（Preconditions）：例如必須有規格 ID 或明確 owner、或已收集初步中繼檔等。
- 執行腳本（Script / Playbook）：步驟式作業，包含自動化與人工判定點。
- 決策規則（Decision Matrix）：影響度 × 修正成本 → 建議動作（回流哪一層）。
- 輸出 artifact（Issue/Task/規格變更草案/測試條目）。
- 失敗處理與 SLA（若資訊不足，如何退回或延後）。
- 測試總集生成策略（如何從觀察形成第一版）。

---

## 5. AI output contract（AI 輸出約定，必須遵守）
所有由 AI 生成的規格/企劃/說明檔，必須包含下列欄位（machine-readable）：
- id: 唯一識別
- title: 短標題
- status: one of ["no_data","conflict","candidate","verified"]
- layer: one of ["observed","deduced","inferred","recommendation","specified"]
- evidence: array of evidence entries (each: {type: "user-input"|"document"|"test-log"|"instrument", uri: "...", confidence: 0..1})
- sources: array of {source_type, uri, timestamp}
- verification_method: text 或 URI（若 status==verified 必須有）
- verification_criteria: 可檢查的條件（若 status==verified 必須有）
- recommended_action: one of ["spec_change","implementation_change","investigate","record_as_known_limit"]
- generated_by: AI model/id or human
- generated_at: ISO8601 timestamp

範例（簡化 JSON）:
{
  "id":"SPEC-2026-001",
  "title":"API: user_id 必填",
  "status":"candidate",
  "layer":"inferred",
  "evidence":[{"type":"document","uri":"/specs/api.md#L10","confidence":0.8}],
  "sources":[{"source_type":"document","uri":"/specs/api.md#L10","timestamp":"2026-08-20T10:00:00Z"}],
  "verification_method":"run integration test X",
  "recommended_action":"investigate",
  "generated_by":"ai-v1",
  "generated_at":"2026-08-20T10:10:00Z"
}

規則：若 status=="no_data"，輸出必須清楚指出缺什麼資料與建議的收集方式；不得把 "no_data" 升級為 "candidate" 或 "verified" 未經實際資料支持。

---

## 6. 規格 vs 測試總集的明確判定規則（快速參考）
- 規格錯誤/不完整（要在製作前修正）：
  - 該項目在規格文件中未定義或定義模糊（缺失驗證方法、缺責任人）。
  - 動作：回流規格（產品/企劃/架構師負責補完）。

- 實作錯誤（implementation bug）：
  - 規格已明確要求，實作未符合。
  - 動作：建立修正任務、回到製作。

- 規格外（observation-driven）：
  - 製作運行或測試中觀察到的新現象（未被規格描述）。
  - 動作：建立規格外 Issue，判定為上面兩者之一或列為已知限制。

- 衝突資料（conflict）：
  - 不同來源/環境輸出衝突，無法自動決策。
  - 動作：標記為 conflict，收集更多中繼證據，人工決策。

---

## 7. 測試總集生成原則（第一版如何產生）
1. 製作啟動時先執行 minimal-run（最小可行執行），收集中繼/日誌/回應樣本。這個階段重點在「收集中繼」，非事先完全定義所有測試條目。  
2. 執行自動化/半自動發現器（scripts）去掃描中繼，找出缺失、欄位異常、格式不合、行為與預期不符、依賴錯誤等。  
3. 將發現自動建立為 untriaged 的「規格外 Issue」，包含 artifact link（中繼檔）、簡短描述與建議分類。  
4. 指派規格負責人與實作負責人於 SLA（例如 48 小時）內判定：若是規格不完整 → 回流規格；若是實作錯誤 → 建立修正任務；若是可接受限制 → 記錄為已知限制並加入測試總集。  
5. 判定完成後，將「需要持續檢測」的項目整理為測試條目，形成第一版測試總集（由觀察驅動且可驗證）。

---

## 8. 測試用例標準格式（每個檢查條目）
- id: TEST-YYYY-NNN
- title: 示意（例如：API 必填欄位檢查）
- category: [資訊|問題|限制|需求|影響|行為]
- trigger: [auto-ci|manual-qa|ai-generated]
- preconditions: (必要的環境/版本/資料)
- steps: (可自動化或手動步驟)
- input_sample: artifact url or sample id
- expected_result: clear pass condition
- failure_evidence: artifact url template
- suggested_classification: spec_error | impl_bug | conflict | limitation
- risk_level: low|medium|high
- owner: team/person
- sla_for_initial_decision: e.g., 48h
- close_condition: decision + followup task or recorded limit

---

## 9. 規格外 Issue template（可放入 .github/ISSUE_TEMPLATE/regulation-outside.md）
標題範例：[規格外][TEST-001] 簡短標題
內容欄位：
- 發現時間：
- 發現者：
- 來源 artifact（中繼檔/日誌/截圖/回應）與連結：
- 測試/Run ID：
- 初步分類（資訊/問題/限制/需求/影響/行為）：
- 建議回流位置：
- 初步風險等級（低/中/高）：
- 建議緊急程度（立即/高/中/低）：
- 指派人：
- SLA（例如：48h 初判）：
- 關閉條件：

---

## 10. 決策矩陣（影響度 × 修正成本）
- 影響度 High & 成本 Low → 立即回流規格並優先修（需 product/arch 簽核）。
- 影響度 High & 成本 High → 召開 stakeholder 決策會（可能改需求或列為已知限制）。
- 影響度 Low & 成本 Low → 指派實作修正（回到製作）。
- 影響度 Low & 成本 High → 記錄為已知限制並標注風險緩解計畫。

---

## 11. CI / 自動化建議
- pipeline 新增 stage: 規格外發現（runs discovery scripts）。
- discovery scripts 採用 test collection 的少量檢查以收集中繼，將發現建立成 untriaged Issue（使用 GitHub CLI 或 API）。
- 若 PR 包含 AI 生成的規格檔：執行 metadata-check（檢查 status, evidence, verification_method），若不合格則阻擋 merge 或加 warning label。 
- test_result.json schema（供自動化使用）:
{
  "test_id":"TEST-001",
  "run_id":"RUN-2026-08-20-001",
  "status":"pass|fail|skipped",
  "evidence_url":"https://.../artifact.json",
  "fail_classification":"資訊|問題|限制|需求|影響|行為",
  "recommended_action":"spec|design|implementation|known_limit",
  "risk":"low|medium|high",
  "owner":"team/person",
  "timestamp":"ISO8601",
  "decision_suggested_by":"script|qa|ai",
  "decision_deadline":"ISO8601"
}

---

## 12. 角色與 SLA（建議）
- 規格負責人（Product/PO/Architect）：負責判定規格不完整並核准規格變更。SLA: 48 小時初判。
- 製作負責人（Engineering Lead）：負責實作修正任務與回報結果。SLA: 依優先級。
- 驗證人（QA/Tester）：負責執行測試總集與收集中繼證據。SLA: 測試回報在 Run 完成後 24 小時內上傳證據。
- 決策召集人（若衝突）：由 Product 或 Architect 指派，召開決策會（72 小時內）。

---

## 13. 後續落地產物（我可以幫你產出）
- 規格 vs 測試總集 判定指南（Markdown）——已納入此檔。  
- .github/ISSUE_TEMPLATE/regulation-outside.md（可立即加入 repo）——我可以幫你建立 PR。  
- 測試總集骨架（含 20 個常見測試用例）——我可草擬並 PR。  
- 最小 CI 範例 script（收集中繼並自動建立 untriaged Issue）——我可提供範例 Node/Python/shell。  

---

## 14. 實例（極短）
用例 A（無資料）：AI 嘗試生成一個欄位驗證，但 evidence array empty → status=no_data；輸出建議：收集實際 API logs 或 sample payload。  
用例 B（衝突）：staging 與 prod 同一輸入出現不同行為 → status=conflict；自動建立 Issue 並建議進一步收集 traces；人工決策後再回流。  
用例 C（由觀察產生測試條目）：第一次執行時發現 API 有欄位為 null（未在規格中定義）→ 建立規格外 Issue 並判定為 "spec_error" → 規格負責人補完後，該項目被加入測試總集第一版。

---

## 15. 下一步（建議執行計畫）
1. 同意此文件變更並 merge。  
2. 我幫你建立 .github/ISSUE_TEMPLATE/regulation-outside.md（或我直接 PR），以及測試總集骨架（20 個初始用例）。  
3. 在 CI 加入 minimal-run 階段，收集中繼並自動建立 untriaged Issue（示例 script 我可提供）。  

---

## 16. 結語
你已經把最關鍵的問題看清楚了：不要把觀察（實作資料）事前假設成已知。把規格當成意圖與驗證契約，讓測試總集由真實觀察驅動，能有效避免規則謬誤與工程溝通衝突。若你同意，我會立刻：
- 在 repo 建立 Issue template（regulation-outside），
- 產出測試總集骨架（Markdown），
- 提供 minimal-run 的 CI 範例 script。

請回覆你要我先做哪一項（Issue template / 測試總集骨架 / CI 範例 / 或全部一起），我就開始建立 PR 並回報進度。