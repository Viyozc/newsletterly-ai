# Newsletterly — 1 页 PRD

> 定位：免费「Newsletter 增长就绪度」审计 + 付费 AI 改写/选题/跨平台分发。复用 Listora/BookListing/Mockly 已验证的「免费审计钩子 + 邮件捕获 + freemium」路径。

---

## 1. Problem
Newsletter 收入是极端幂律：**中位转化率仅 0.62%**（读者→付费），但**头部 10% 拿走 62% 的订阅收入**。绝大多数创作者不知道自己离「头部 10%」差在哪——subject line、发送节奏、CTA、niche 匹配度这些可操作杠杆被忽视。现有工具要么只打单条主题行分（SendCheckIt），要么做竞品侦察（Newsletrix），没有一个面向「你自己 newsletter 整体增长就绪度」的零成本综合审计。

## 2. Wedge（楔子）
**免费 Newsletter 增长就绪度审计**：输入平台 + 最近主题行 + 发送节奏 + 送达率设置 + CTA + niche → 即时 0–100 综合分 + 六维雷达 + Top-3 改进清单。
- vs 主题行评分器（SendCheckIt 等）：从「单条打分」升级为「整体增长就绪度综合分 + 批量历史线审计」。
- vs Newsletrix：从「侦察竞品」转为「审计并增长你自己的 newsletter」。
- 核心叙事锚定幂律痛点：**「中位 0.62%，头部拿 62%——你的分在哪？」**

## 3. Target User
Substack / Beehiiv / Ghost / Kit 个人创作者，5K–50K 订阅的「认真玩家」，尤其 AI/科技/财经/职场垂直（zc 自身 AI 记者资产可直接杠杆）。

## 4. Product
- **免费层**：六维审计（Subject 17 / Preview 16 / Cadence 17 / Deliverability 17 / CTA 16 / Niche 17 = 100），邮件捕获（Formspree）。
- **付费层（freemium $9–19/月）**：AI 批量重写主题行、生成下一期选题、把 newsletter 内容一键改写成小红书/YouTube/推文（呼应 creator-economy 跨平台分发真实需求）。

## 5. MVP Scope
- Next.js (App Router) + Supabase + LLM（复用 etsy-listing-ai/mvp 骨架）。
- 页面：审计结果页 + AI 改写页；API：`/api/rewrite`（服务端 LLM，单封 < $0.01）+ `/api/audit-log`（匿名埋点，修复「无集中度量」缺口）。
- 邮件列表接 Formspree / Supabase。

## 6. Business Model
Freemium：$0 审计 → $9/月（改写+选题）→ $19/月（跨平台分发+批量）。锚定 email ROI $42/$1、Beehiiv 广告网络月付创作者 $1M+ 的付费环境。

## 7. Validation Gate（与三站一致）
各站 **≥200 次审计 + ≥50 邮箱订阅**（2 周窗口）→ 进 MVP。

## 8. Success Metrics
- 审计完成率、邮件订阅率、付费转化率、AI 改写调用量。

## 9. Risks
- **Newsletrix 强免费**：用「整体增长就绪度 + 自己 vs 竞品」叙事避开正面功能战。
- **主题行评分校准争议**（乱码高分）：综合分含语义维度（niche fit / 转化就绪）降低误判观感。
- **平台内置分析**：落地页强调「跨平台、一次性、不依赖平台数据」。

## 10. Next Actions
- [x] 静态审计站 + 部署（本 PRD 对应站点已上线）
- [ ] zc 粘贴免费 Formspree ID → 真实邮件捕获
- [ ] zc 发布获客内容（content-plan.md）
- [ ] 跑 2 周流量验证，达门槛进 MVP
