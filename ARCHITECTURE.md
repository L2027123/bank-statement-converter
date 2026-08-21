# Bank Statement Converter — 完整架构文档

> 本文档供 AI 助手或开发者迁移项目时使用，包含完整的项目结构、技术栈、数据库设计、API 接口、核心逻辑和部署信息。

---

## 1. 项目概述

**产品名称**: Bank Statement Converter
**产品定位**: 面向美国市场的银行对账单 PDF 转 Excel/CSV 的 SaaS 工具
**生产地址**: https://bank-statement-converter-lemon.vercel.app
**GitHub**: https://github.com/L2027123/bank-statement-converter
**本地路径**: `C:\Users\User\Desktop\bankstatementconverter`
**联系邮箱**: junliang2027@outlook.com

### 商业模式
- **Credit 制（非订阅）**: 按次付费，不按月订阅
- **定价**: Starter $5/10次 · Pro $19/50次 · Tax Season Pack $29/100次
- **免费额度**: 每月 3 次免费转换（需注册）
- **演示模式**: 无需注册即可试用（`?demo=true`）
- **支付**: 尚未接入 Stripe，目前用 Waitlist 收集意向用户

---

## 2. 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) | 16.3.1 |
| 语言 | TypeScript | 5.x |
| UI | Tailwind CSS + 自定义 shadcn/ui 组件 | Tailwind 4 |
| 字体 | Inter (Google Fonts) | — |
| 数据库 | Supabase (PostgreSQL) | — |
| 认证 | Supabase Auth (邮箱密码 + Google OAuth) | — |
| 存储 | Supabase Storage (private buckets + signed URLs) | — |
| PDF 解析 | pdf-parse (动态 import) | 2.4.5 |
| AI 解析 | DeepSeek API (deepseek-chat 模型) | — |
| Excel 生成 | xlsx (SheetJS) | 0.18.5 |
| 部署 | Vercel | — |
| Node | >= 18 | — |

### 环境变量（.env.local / Vercel）

```
NEXT_PUBLIC_SUPABASE_URL=https://qdrcofomnznybbgloqsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iyOAYkmpzTasxpqWeX8MGQ__GjlEH5J
DEEPSEEK_API_KEY=（配置在 Vercel 环境变量中，不入库）
ADMIN_PASSWORD=niuniu7626
# 可选
NEXT_PUBLIC_SITE_URL=https://bank-statement-converter-lemon.vercel.app
CRON_SECRET=（可选，用于保护 cron API）
SUPABASE_SERVICE_ROLE_KEY=（仅 admin API 使用，可选）
```

---

## 3. 项目结构

```
bankstatementconverter/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局（Inter 字体 + Analytics + FloatingContact）
│   ├── page.tsx                  # 首页（Hero + Pricing + 银行列表）
│   ├── globals.css               # Tailwind 主题（品牌色定义）
│   ├── robots.ts                 # robots.txt 生成
│   ├── sitemap.ts                # sitemap.xml 生成（50+ 银行页）
│   │
│   ├── upload/
│   │   └── page.tsx              # 上传/解析页（核心交互页）
│   │
│   ├── login/
│   │   └── page.tsx              # 登录/注册页（邮箱密码 + Google OAuth）
│   │
│   ├── dashboard/
│   │   ├── page.tsx              # 仪表盘（服务端组件，查 DB）
│   │   └── DashboardClient.tsx   # 仪表盘客户端组件（交互逻辑）
│   │
│   ├── admin/
│   │   └── page.tsx              # 管理后台（Analytics + Contact + Waitlist）
│   │
│   ├── bank/
│   │   └── [bankName]/
│   │       └── page.tsx          # 银行 SEO 着陆页（SSG，50 个银行）
│   │
│   ├── privacy/
│   │   └── page.tsx              # 隐私政策（含 AI 处理披露）
│   │
│   ├── terms/
│   │   └── page.tsx              # 服务条款
│   │
│   ├── alternatives/
│   │   └── bankstatementconverter/
│   │       └── page.tsx          # 竞品对比页
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts           # OAuth 回调处理
│   │
│   └── api/
│       ├── parse-statement/
│       │   └── route.ts           # ⭐ 核心 API：PDF 解析 + AI + Excel/CSV 生成
│       ├── waitlist/
│       │   └── route.ts           # Waitlist 收集（landing_page + bank_request）
│       ├── signed-url/
│       │   └── route.ts           # 签名 URL 生成（5 分钟有效）
│       ├── track/
│       │   └── route.ts           # 页面访问追踪
│       ├── contact/
│       │   └── route.ts           # 联系表单提交
│       ├── cron/
│       │   └── daily-report/
│       │       └── route.ts       # 每日健康检查（Vercel Cron）
│       └── admin/
│           ├── stats/
│           │   └── route.ts       # 管理后台：访问统计
│           ├── waitlist/
│           │   └── route.ts       # 管理后台：Waitlist 列表
│           └── contact-list/
│               └── route.ts       # 管理后台：联系表单列表
│
├── components/
│   ├── ui/
│   │   ├── button.tsx            # Button（cva variants: default/success/outline/ghost/link/destructive）
│   │   ├── card.tsx              # Card / CardHeader / CardContent / CardTitle
│   │   ├── input.tsx             # Input
│   │   └── progress.tsx          # Progress bar
│   ├── Analytics.tsx             # 页面访问追踪（session cookie + /api/track）
│   ├── FloatingContact.tsx       # 右下角浮动联系按钮（表单提交到 /api/contact）
│   ├── WaitlistForm.tsx          # Waitlist 邮箱收集表单（用于 Pricing 卡片）
│   └── RequestBankForm.tsx       # F2: 银行请求表单（解析失败时展示）
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 浏览器端 Supabase 客户端
│   │   ├── server.ts             # 服务端 Supabase 客户端（cookies）
│   │   └── middleware.ts         # Auth 中间件（demo 模式 + 路由保护）
│   ├── banks.ts                  # 50 家美国银行数据（slug/name/formatNote/statementTypes）
│   ├── credits.ts                # 额度计算逻辑（plan limits + 月度重置）
│   └── utils.ts                  # cn() 类名合并 + formatUSD()
│
├── supabase/
│   ├── schema.sql                # ⭐ 主 schema（users + statements + storage + RLS + trigger）
│   ├── waitlist.sql              # Waitlist 表
│   ├── make-buckets-private.sql  # S1: bucket 改 private
│   └── migrations/
│       ├── add-csv-url.sql              # statements 加 csv_url 列
│       ├── add-contact-submissions-table.sql  # contact_submissions 表
│       ├── add-page-views-select-policy.sql   # page_views 表 + RLS
│       ├── add-waitlist-metadata.sql    # waitlist 加 metadata 列
│       └── update-get-waitlist-rpc.sql  # get_waitlist() RPC 函数
│
├── middleware.ts                 # 全局中间件入口（调用 updateSession）
├── next.config.ts                # serverExternalPackages: ["pdf-parse"]
├── vercel.json                   # Cron 配置：每日 1:00 UTC 跑 daily-report
├── package.json
└── tsconfig.json
```

---

## 4. 数据库设计

### 4.1 表结构

#### `users` — 用户扩展表（关联 auth.users）

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK → auth.users.id | |
| plan | text | `free` / `pro` / `business`，默认 `free` |
| credits_remaining | int | 剩余额度，默认 3 |
| credits_reset_date | date | 下次重置日期，默认下月1号 |
| created_at | timestamptz | |

**RLS**: 用户只能 SELECT/UPDATE 自己的行。

#### `statements` — 对账单记录

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → auth.users.id | |
| filename | text | 原始文件名 |
| storage_path | text | Supabase Storage 路径（`{userId}/{uuid}.pdf`） |
| status | text | `pending` / `processing` / `completed` / `failed` |
| parsed_data | jsonb | 解析出的交易数组 |
| excel_url | text | ⚠ 存储的是 **storage path**（不是 URL），如 `{userId}/{statementId}.xlsx` |
| csv_url | text | 同上，`{userId}/{statementId}.csv` |
| created_at | timestamptz | |
| updated_at | timestamptz | 自动触发更新 |

**RLS**: 用户只能 CRUD 自己的对账单。
**Trigger**: `before update` 自动更新 `updated_at`。

#### `waitlist` — 等待列表 / 银行请求

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE (nullable) | 邮箱（bank_request 时可能为空，编码存储） |
| source | text | `landing_page` / `pricing_starter` / `pricing_pro` / `pricing_tax` / `bank_request` |
| metadata | jsonb | 扩展字段（当前未直接使用，bank name 编码在 email 中） |
| created_at | timestamptz | |

**bank_request 编码方案**:
- 无邮箱: `bank:{bank_name}:{unique_suffix}`
- 有邮箱: `{email}|bank:{bank_name}:{unique_suffix}`
- unique_suffix = `Date.now().toString(36) + random`，避免 UNIQUE 冲突
- Admin 端 `decodeEntry()` 函数解码

**RLS**: anon INSERT only（W1 改造后删除了 authenticated SELECT）。
**RPC**: `get_waitlist()` SECURITY DEFINER 函数供 admin 查询。

#### `page_views` — 页面访问追踪

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| path | text | 页面路径（最长 500 字符） |
| referrer | text | 来源页 |
| session_id | text | 会话 ID（cookie，30 天有效） |
| is_demo | boolean | 是否演示模式访问 |
| created_at | timestamptz | |

**RLS**: anon/anthenticated INSERT + SELECT。

#### `contact_submissions` — 联系表单

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| name | text | |
| email | text | |
| message | text | 最长 2000 字符 |
| source | text | 来源页面 |
| is_demo | boolean | |
| created_at | timestamptz | |

**RLS**: anon/anthenticated INSERT + SELECT。

### 4.2 Storage Buckets

| Bucket | 可见性 | 用途 | 路径格式 |
|---|---|---|---|
| `statements` | **private** (S1 改造) | 上传的 PDF | `{userId}/{uuid}.pdf` |
| `exports` | **private** (S1 改造) | 生成的 Excel/CSV | `{userId}/{statementId}.xlsx` / `.csv` |

**Storage RLS**: 用户只能 CRUD 自己文件夹（`{userId}/`）下的文件。
**下载方式**: `createSignedUrl(path, 300)` 生成 5 分钟有效签名 URL。

### 4.3 Trigger / RPC

- `handle_new_user()`: 用户注册时自动创建 `users` 行（plan=free, credits=3）。
- `set_updated_at()`: statements 更新时自动刷新 updated_at。
- `get_waitlist()`: SECURITY DEFINER，绕过 RLS 查询 waitlist（供 admin API）。

---

## 5. 核心业务流程

### 5.1 PDF 解析流程（`/api/parse-statement`）

```
用户上传 PDF
    │
    ├─ [Demo 模式] → 使用模拟数据 → 规则解析 → 生成 Excel/CSV → base64 返回前端
    │
    └─ [正式模式]
        │
        ├─ 1. 验证用户登录 + 额度检查
        ├─ 2. 从 Storage 下载 PDF
        ├─ 3. pdf-parse 提取文本（动态 import）
        ├─ 4. AI 解析（DeepSeek API）
        │     ├─ 成功 → 使用 AI 结果
        │     └─ 失败 → 降级到规则解析器
        ├─ 5. 验证结果非空（空则报错，不扣费）
        ├─ 6. F1 余额校验：opening + Σ(credit-debit) == closing
        ├─ 7. 生成 Excel（xlsx）+ CSV
        ├─ 8. 上传到 Storage（exports bucket）
        ├─ 9. 更新 statements 表（status=completed, excel_url=path, csv_url=path）
        ├─ 10. 扣减额度（credits_remaining - 1）
        └─ 11. 返回 JSON（statement + balanceCheck + demo?excel_base64）
```

### 5.2 AI 解析（DeepSeek）

- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **模型**: `deepseek-chat`
- **System Prompt**: 提取交易记录为 JSON 对象（含 opening_balance, closing_balance, transactions 数组）
- **温度**: 0
- **Max tokens**: 4000
- **响应处理**: 清理 markdown 代码块 → JSON.parse → 兼容对象格式和数组格式

### 5.3 规则解析器（降级方案）

- 日期正则: `(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})`
- 金额正则: `\$?\s?([\d,]+(?:\.\d{2})?)`
- 关键词识别: CREDIT/DEBIT/Deposit/Withdrawal/Payment 等
- 从全文提取 opening/closing balance

### 5.4 F1 余额自动校验

```typescript
function computeBalanceCheck(transactions, opening, closing): BalanceCheck {
  // 无期初/期末余额 → skipped
  // 计算: opening + Σ(credit - debit) = calculated
  // 比较: |calculated - closing| < 0.01 → verified
  // 否则 → mismatch（显示偏差金额）
}
```

- 验证通过 → Excel 最后一行加 "✓ Balance Verified"
- 验证失败 → Excel 最后一行加 "⚠ Balance mismatch detected, please review"
- 前端展示余额校验 banner（绿/黄/灰三色）

### 5.5 F2 Request a bank

- 解析失败页面显示 "Your bank not supported? Request it" 按钮
- 点击展开 `RequestBankForm` 组件
- 收集银行名（必填）+ 邮箱（可选）
- 提交到 `/api/waitlist`（source='bank_request'）
- 成功后显示 "✓ Request received" + Close 按钮

### 5.6 下载流程（S1 签名 URL）

```
前端点击 Download
    │
    ├─ [Demo 模式] → 从 base64 数据生成 Blob → 下载
    │
    └─ [正式模式]
        ├─ GET /api/signed-url?statement_id=xxx&type=excel
        ├─ 服务端验证用户身份 + 查 statements 表
        ├─ 从 excel_url/csv_url 列取 storage path
        ├─ 兼容旧数据（如果是完整 URL 则提取 path）
        ├─ createSignedUrl(path, 300) → 5 分钟有效签名 URL
        └─ 前端 window.open(url) 下载
```

### 5.7 Demo 模式

- URL 参数 `?demo=true` 或 cookie `demo_mode=true`
- 中间件检测 demo 模式 → 跳过认证，设置 cookie
- 上传页显示 "立即试用" 按钮（无需上传文件）
- API 返回 base64 编码的 Excel/CSV，不写数据库
- Dashboard 显示模拟历史记录

---

## 6. API 接口清单

| 方法 | 路径 | 认证 | 用途 |
|---|---|---|---|
| POST | `/api/parse-statement` | 用户/Demo | 解析 PDF，返回交易+Excel+CSV |
| POST | `/api/waitlist` | 无 | 收集邮箱/银行请求 |
| GET | `/api/signed-url` | 用户 | 生成 5 分钟签名下载 URL |
| POST | `/api/track` | 无 | 记录页面访问 |
| POST | `/api/contact` | 无 | 提交联系表单 |
| GET | `/api/admin/stats` | Admin密码 | 访问统计数据 |
| GET | `/api/admin/waitlist` | Admin密码 | Waitlist 列表 |
| GET | `/api/admin/contact-list` | Admin密码 | 联系表单列表 |
| GET | `/api/cron/daily-report` | CRON_SECRET | 每日健康检查 |
| GET | `/auth/callback` | OAuth | Google OAuth 回调 |

**Admin 认证方式**: `Authorization: Bearer {ADMIN_PASSWORD}`
**Admin 密码**: 环境变量 `ADMIN_PASSWORD`，默认 `niuniu7626`

---

## 7. 页面路由

| 路径 | 类型 | 认证 | 说明 |
|---|---|---|---|
| `/` | 客户端 | 无 | 首页（Hero + Pricing + 银行列表） |
| `/upload` | 客户端 | 需登录/Demo | 上传+解析页 |
| `/login` | 客户端 | 无 | 登录/注册 |
| `/dashboard` | 服务端→客户端 | 需登录/Demo | 仪表盘 |
| `/admin` | 客户端 | Admin密码 | 管理后台 |
| `/bank/[bankName]` | SSG | 无 | 50 个银行 SEO 着陆页 |
| `/privacy` | — | 无 | 隐私政策 |
| `/terms` | — | 无 | 服务条款 |
| `/alternatives/bankstatementconverter` | — | 无 | 竞品对比 |

**路由保护**: middleware.ts 检测 `/upload` 和 `/dashboard`，未登录重定向到 `/login?redirect=...`。

---

## 8. UI 设计规范

### 品牌色

```css
--color-brand: #1e3a5f;        /* 深蓝（主色） */
--color-brand-dark: #15263d;   /* 深蓝悬停 */
--color-success: #22c55e;      /* 成功绿 */
--color-danger: #ef4444;       /* 危险红 */
--color-muted: #f1f5f9;       /* 浅灰背景 */
--color-border: #e2e8f0;      /* 边框灰 */
```

### 组件

- **Button**: 6 种 variant（default/success/outline/ghost/link/destructive），4 种 size
- **Card**: 白底 + border + 8px 圆角
- **Progress**: 品牌色进度条
- **字体**: Inter（Google Fonts）
- **圆角**: 8px (lg)
- **移动端**: 全部页面适配

---

## 9. SEO 策略

- **50 个银行着陆页**: `/bank/[bankName]`，SSG 预生成
- **每个银行页**: 动态生成痛点描述、解决方案、FAQ
- **sitemap.xml**: 包含所有静态页 + 50 个银行页
- **robots.txt**: 允许爬虫，禁止 `/api/` 和 `/dashboard`
- **银行数据**: `lib/banks.ts` 包含 50 家美国银行的 slug/name/fullName/formatNote/statementTypes

---

## 10. 安全设计

### 认证
- Supabase Auth：邮箱密码 + Google OAuth
- Middleware 保护 `/upload` 和 `/dashboard`
- API 路由验证用户 session

### RLS 策略
- `users`: 用户只能读写自己的行
- `statements`: 用户只能 CRUD 自己的对账单
- `waitlist`: anon INSERT only（W1 改造后）
- `page_views` / `contact_submissions`: anon INSERT + SELECT

### 文件存储
- 两个 bucket 均为 **private**（S1 改造）
- 下载需通过 `/api/signed-url` 生成 5 分钟签名 URL
- 用户只能访问自己文件夹下的文件

### 数据安全
- 解析失败不扣费（验证结果非空后才扣 credits）
- 联系表单限制消息长度（2000 字符）
- 页面访问追踪仅记录 path/session_id，不记录 PII
- AI 处理披露：隐私政策页面声明使用 DeepSeek API

### Admin
- Admin API 需 Bearer 密码
- Waitlist 查询通过 SECURITY DEFINER RPC 函数绕过 RLS

---

## 11. 已知技术债 / 注意事项

1. **bank_request 编码方案**: 银行名编码在 email 列中（`bank:{name}:{unique}`），不是正式的数据库设计。未来应迁移到 `metadata` jsonb 列或独立 `bank_name` 列。
2. **pdf-parse 动态 import**: 必须使用 `const { PDFParse } = await import("pdf-parse")` 而非静态 import，否则 Vercel 函数模块加载阶段崩溃。`next.config.ts` 中 `serverExternalPackages: ["pdf-parse"]`。
3. **excel_url/csv_url 列名误导**: 列名仍叫 `excel_url` 但实际存储的是 storage path（S1 改造后），不是 URL。
4. **旧数据兼容**: `signed-url` API 兼容处理旧数据（如果 excel_url 是完整 URL 则提取 path）。
5. **@anthropic-ai/sdk 依赖残留**: package.json 中仍有 `@anthropic-ai/sdk` 但已不使用，可安全移除。
6. **Google OAuth**: 需在 Supabase Dashboard 配置 Google Provider + redirect URL。
7. **Vercel Cron**: `vercel.json` 配置每日 1:00 UTC 跑 `/api/cron/daily-report`，仅健康检查，不发邮件。

---

## 12. 部署流程

### 首次部署

```bash
# 1. 克隆项目
git clone https://github.com/L2027123/bank-statement-converter.git
cd bank-statement-converter

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.local.example .env.local
# 填入 Supabase URL/Anon Key、DeepSeek API Key、Admin Password

# 4. 执行数据库迁移
# 在 Supabase SQL Editor 中依次执行:
#   supabase/schema.sql
#   supabase/waitlist.sql
#   supabase/migrations/*.sql
#   supabase/make-buckets-private.sql

# 5. 本地开发
npm run dev

# 6. 部署到 Vercel
# - 连接 GitHub 仓库
# - 配置环境变量（同 .env.local）
# - 自动部署
```

### 更新部署

```bash
git add -A
git commit -m "描述"
git push origin main
# Vercel 自动触发部署
```

---

## 13. 测试清单

### Demo 模式
- [ ] 访问 `/upload?demo=true`
- [ ] 点击"立即试用" → 显示解析动画
- [ ] 解析完成 → 显示 12 条交易 + 余额校验
- [ ] Download Excel → 文件可打开
- [ ] Download CSV → 文件可打开

### 正式模式
- [ ] 注册账号 → 自动创建 profile (free, 3 credits)
- [ ] 登录 → 跳转 Dashboard
- [ ] 上传 PDF → 解析成功
- [ ] 额度扣减 (3 → 2)
- [ ] Dashboard 历史记录显示
- [ ] 下载 Excel/CSV（签名 URL）
- [ ] 上传非 PDF → 报错
- [ ] 上传 >10MB → 报错

### 错误处理
- [ ] 解析失败 → 不扣费
- [ ] 解析失败 → 显示 "Request it" 按钮
- [ ] 提交银行请求 → 成功消息常驻

### Admin
- [ ] 访问 `/admin` → 输入密码
- [ ] Analytics tab → 显示统计数据
- [ ] Contact tab → 显示联系表单
- [ ] Waitlist tab → 显示等待列表 + 银行请求

---

## 14. 文件功能映射（快速查找）

| 需求 | 文件 |
|---|---|
| 修改首页 | `app/page.tsx` |
| 修改上传/解析页 | `app/upload/page.tsx` |
| 修改解析逻辑 | `app/api/parse-statement/route.ts` |
| 修改 AI prompt | `app/api/parse-statement/route.ts` → `SYSTEM_PROMPT` |
| 修改规则解析器 | `app/api/parse-statement/route.ts` → `parseRuleBased()` |
| 修改余额校验 | `app/api/parse-statement/route.ts` → `computeBalanceCheck()` |
| 修改下载逻辑 | `app/api/signed-url/route.ts` + `app/upload/page.tsx` → `handleDownloadExcel/CSV()` |
| 修改定价 | `app/page.tsx` → `PLANS` 数组 |
| 修改银行列表 | `lib/banks.ts` → `BANKS` 数组 |
| 修改额度逻辑 | `lib/credits.ts` |
| 修改认证中间件 | `lib/supabase/middleware.ts` |
| 修改 Admin 页面 | `app/admin/page.tsx` |
| 修改数据库表 | `supabase/schema.sql` + `supabase/migrations/` |
| 修改品牌色 | `app/globals.css` → `@theme` |
| 修改 Button 样式 | `components/ui/button.tsx` |
| 修改 Waitlist 表单 | `components/WaitlistForm.tsx` |
| 修改银行请求表单 | `components/RequestBankForm.tsx` |
| 修改浮动联系按钮 | `components/FloatingContact.tsx` |
| 修改页面追踪 | `components/Analytics.tsx` + `app/api/track/route.ts` |
| 修改 Cron 任务 | `app/api/cron/daily-report/route.ts` + `vercel.json` |
| 修改 SEO | `app/sitemap.ts` + `app/robots.ts` + `app/bank/[bankName]/page.tsx` |

---

*文档生成时间: 2026-08-20*
*最后更新: F2 Request a bank 功能验证通过*
