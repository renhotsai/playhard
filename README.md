# 4-Agent Feature Pipeline for Claude Code

Planner → Coder → Tester → Reviewer，透過 `.pipeline/` 資料夾裡的交接檔串成一條流水線。
一個指令 `/ship`，跑完四個階段，最後留一個未 commit 的分支給你審。

---

## 安裝

把 `.claude/` 整個資料夾複製到你的專案根目錄：

```bash
cp -r pipeline-kit/.claude /path/to/your/project/
cd /path/to/your/project
```

加到 `.gitignore`（交接檔是暫存的，不該進版控）：

```bash
echo ".pipeline/" >> .gitignore
```

`.claude/agents/` 和 `.claude/commands/` **應該** commit 進版控 —— 團隊 pull 下來就有一樣的 pipeline。

裝完後**重啟 Claude Code**。檔案型 subagent 是在 session 啟動時載入的，直接改磁碟上的檔案不重啟不會生效。

確認有讀到：

```
/agents      # 應該列出 planner / coder / tester / reviewer
/ship        # 應該出現在斜線指令自動補全裡
```

---

## 使用

```bash
git checkout -b feat/rate-limit
```

然後在 Claude Code 裡：

```
/ship add rate limiting to the login endpoint, max 5 attempts per minute per IP, return 429 with Retry-After header
```

流程會自己跑完四個階段。任何一階段出問題就停下來告訴你原因。

早上起來：

```
cat .pipeline/review.md
git diff
```

`VERDICT: SHIP` → 自己看過 diff 再 merge。
`NEEDS WORK` / `BLOCK` → 讀 Must fix 清單，決定自己修還是調整需求重跑。

**pipeline 不會自動 commit 或 merge。** 最後一道人工關卡是你。

---

## 四個檔案在做什麼

| 檔案 | 角色 | 模型 | 產出 |
|---|---|---|---|
| `.claude/agents/planner.md` | 需求 → 規格，不寫 code | opus | `.pipeline/spec.md` |
| `.claude/agents/coder.md` | 照規格實作，不加料 | sonnet | `.pipeline/changes.md` + 實際 code |
| `.claude/agents/tester.md` | 寫測試並執行，失敗就停 | sonnet | `.pipeline/test-results.md` + 測試檔 |
| `.claude/agents/reviewer.md` | 唯讀審查，給裁決 | opus | `.pipeline/review.md` |
| `.claude/commands/ship.md` | orchestrator，串接四者 | — | 最終報告 |

三條刻意的限制，拿掉就沒意義了：

1. **Planner 不寫 code。** 規格品質決定下游天花板。
2. **Tester 不修 code。** 能修的人會傾向讓測試變綠，而不是回報問題。
3. **Reviewer 唯讀。** 有能力自己 patch 的審查者，會偏好「反正我改一下就好」的結論。沒有編輯權，唯一有用的輸出就是誠實描述。

---

## 常見狀況

**`/ship` 沒出現** → 沒重啟 Claude Code，或 `.claude/commands/` 不在專案根目錄。

**agent 沒被叫到** → 在 `/agents` 確認四個都有載入。orchestrator 是靠 `description` 欄位裡的名字去委派的，改名字要四個檔案一起改。

**Planner 一直丟 OPEN QUESTIONS** → 需求太模糊。「加個 rate limit」 vs 「login endpoint 加 rate limit，每 IP 每分鐘 5 次，超過回 429 帶 Retry-After」——後者的規格會緊實非常多。

**Tester 找不到測試框架** → repo 裡本來就沒測試的話，先手動建一個最小可跑的測試檔和指令，之後 Tester 就會照著模仿。

**想並行跑多個 feature** → 一定要用 `git worktree`，不然兩條 pipeline 會互相覆寫同一批檔案。

---

## 成本

Opus 只跑 planner 和 reviewer，各一次。Sonnet 跑 coder 和 tester，這兩個產出最多 token。
實務上大約七成 token 落在便宜的模型上。

需要更省，把 tester 改成 `model: haiku` 試試 —— 對測試框架明確、規格清楚的 repo 通常夠用。

---

## 改造建議

- **加第五個 agent**：`documenter`（sonnet），讀 `changes.md` 更新 README / API 文件。
- **接 CI**：在 Stage 4 之後加一段跑 lint 和 type check，結果併進 `review.md`。
- **中文輸出**：在每個 agent 的 system prompt 最後加一行 `Write all .pipeline/*.md files in Traditional Chinese.`（code 和 commit message 仍建議維持英文）。
- **允許重試**：目前 tester 失敗就停。可以在 `ship.md` 加一個「失敗時把 test-results.md 丟回 coder，最多重試一次」的分支。
