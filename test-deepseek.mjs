// 测试 DeepSeek API 调用 + JSON 提取
// 用法：
//   PowerShell: $env:DEEPSEEK_API_KEY='sk-...'; node test-deepseek.mjs
//   bash/zsh:   DEEPSEEK_API_KEY=sk-... node test-deepseek.mjs

const SYSTEM_PROMPT =
  "You are a bank statement parsing expert. Extract all transaction records from the following bank statement text. Return a JSON array where each object has: date (YYYY-MM-DD), description (string), debit (number or null), credit (number or null), balance (number or null). Return ONLY the JSON array, no other text.";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error("[ERROR] 请先设置环境变量 DEEPSEEK_API_KEY");
  console.error("  PowerShell: $env:DEEPSEEK_API_KEY='sk-...'; node test-deepseek.mjs");
  process.exit(1);
}

const SAMPLE_TEXT = `Chase Bank Statement
Account Number: XXXX-XXXX-1234
Statement Period: 01/01/2026 - 01/31/2026

Opening Balance: $5,000.00

Transactions:
01/02/2026 DEBIT Walmart Purchase $45.99
01/03/2026 CREDIT Salary Deposit $3,500.00
01/05/2026 DEBIT Netflix Subscription $15.99
01/08/2026 DEBIT Amazon Order $123.45
01/10/2026 CREDIT Refund from Store $25.00
01/12/2026 DEBIT Grocery Store $67.80
01/15/2026 DEBIT Gas Station $42.15

Closing Balance: $8,263.72
`;

function extractTransactions(text) {
  const cleaned = text
    .replace(/^[^\[]*/, "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return [];
  }
  const jsonText = cleaned.slice(start, end + 1);
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) => ({
      date: t.date ?? null,
      description: t.description ?? null,
      debit: t.debit == null ? null : Number(t.debit),
      credit: t.credit == null ? null : Number(t.credit),
      balance: t.balance == null ? null : Number(t.balance),
    }));
  } catch {
    return [];
  }
}

async function main() {
  console.log("[1/3] Calling DeepSeek API...");
  const startedAt = Date.now();
  const aiResp = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: SAMPLE_TEXT },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  console.log(`  HTTP status: ${aiResp.status} (耗时 ${Date.now() - startedAt}ms)`);

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    console.error("[FAIL] DeepSeek API 返回错误：");
    console.error(errText);
    process.exit(1);
  }

  const aiData = await aiResp.json();
  const responseText = aiData?.choices?.[0]?.message?.content ?? "";
  console.log("\n[2/3] DeepSeek 返回的原始 content：");
  console.log("------");
  console.log(responseText);
  console.log("------");

  const transactions = extractTransactions(responseText);
  console.log(`\n[3/3] 解析出 ${transactions.length} 条交易：`);
  console.table(transactions);

  if (transactions.length === 0) {
    console.error("[FAIL] 解析失败，没有提取到任何交易");
    process.exit(1);
  }
  console.log("\n[PASS] DeepSeek API + 解析流程正常 ✓");
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
