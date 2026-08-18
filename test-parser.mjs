// Test for the improved rule-based parser logic

function parseRuleBased(text) {
  const transactions = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const amountPattern = /\$?\s?([\d,]+(?:\.\d{2})?)/g;

  const skipPatterns = /^(statement period|opening balance|closing balance|account number|statement date|balance as of|daily balance|average balance)/i;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    if (skipPatterns.test(line)) continue;

    const month = dateMatch[1].padStart(2, "0");
    const day = dateMatch[2].padStart(2, "0");
    let year = dateMatch[3];
    if (year.length === 2) year = "20" + year;
    const date = `${year}-${month}-${day}`;

    const rest = line.replace(datePattern, "").trim();

    const amounts = [];
    let amtMatch;
    const seen = new Set();
    while ((amtMatch = amountPattern.exec(rest)) !== null) {
      const raw = amtMatch[1];
      const val = parseFloat(raw.replace(/,/g, ""));
      if (!isNaN(val) && !seen.has(raw)) {
        seen.add(raw);
        amounts.push(val);
      }
    }

    let debit = null;
    let credit = null;
    let balance = null;

    if (amounts.length === 1) {
      const isDebit = /(debit|withdrawal|payment|charge|expense|check card|purchase)/i.test(rest);
      const isCredit = /(credit|deposit|refund|income|transfer in|salary)/i.test(rest);
      if (isDebit) debit = amounts[0];
      else if (isCredit) credit = amounts[0];
      else debit = amounts[0];
    } else if (amounts.length === 2) {
      const hasDebitLabel = /(debit|withdrawal|payment|charge|expense|check card|purchase)/i.test(rest);
      const hasCreditLabel = /(credit|deposit|refund|income|transfer in|salary)/i.test(rest);
      if (hasDebitLabel) {
        debit = amounts[0];
        balance = amounts[1];
      } else if (hasCreditLabel) {
        credit = amounts[0];
        balance = amounts[1];
      } else {
        debit = amounts[0];
        credit = amounts[1];
      }
    } else if (amounts.length >= 3) {
      debit = amounts[0] > 0 ? amounts[0] : null;
      credit = amounts[1] > 0 ? amounts[1] : null;
      balance = amounts[2];
    }

    const description = rest
      .replace(/^(debit|credit)\b/i, "")
      .replace(/\$?\s?[\d,]+\.?\d*/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (description || debit !== null || credit !== null) {
      transactions.push({ date, description: description || "Unknown transaction", debit, credit, balance });
    }
  }

  return transactions;
}

// Chase style (debit/credit labels with single amount)
const chaseText = `
Chase Bank Statement
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
01/18/2026 DEBIT Electric Bill $89.00
01/20/2026 CREDIT Freelance Payment $850.00
01/22/2026 DEBIT Restaurant $56.30
01/25/2026 DEBIT Pharmacy $34.50
01/28/2026 DEBIT Internet Service $65.00

Closing Balance: $9,155.93
`;

console.log("=== Testing Improved Rule-Based Parser (Chase Format) ===");
const result = parseRuleBased(chaseText);
console.log(`Found ${result.length} transactions (expected: 12):`);
result.forEach((t, i) => {
  const parts = [];
  if (t.debit != null) parts.push(`Dr: $${t.debit}`);
  if (t.credit != null) parts.push(`Cr: $${t.credit}`);
  if (t.balance != null) parts.push(`Bal: $${t.balance}`);
  console.log(`${i+1}. [${t.date}] ${t.description} | ${parts.join(", ")}`);
});

// Wells Fargo style (two amounts: amount + balance)
const wellsFargoText = `
Wells Fargo Bank
Statement Date: 01/31/2026

01/02/2026 Payment $120.00 $4,880.00
01/03/2026 Credit $3,500.00 $8,380.00
01/05/2026 Check Card $55.99 $8,324.01
01/08/2026 Payment $200.00 $8,124.01
01/15/2026 Credit $500.00 $8,624.01
`;

console.log("\n=== Wells Fargo Format (2-column: amount + balance) ===");
const result2 = parseRuleBased(wellsFargoText);
console.log(`Found ${result2.length} transactions (expected: 5):`);
result2.forEach((t, i) => {
  const parts = [];
  if (t.debit != null) parts.push(`Dr: $${t.debit}`);
  if (t.credit != null) parts.push(`Cr: $${t.credit}`);
  if (t.balance != null) parts.push(`Bal: $${t.balance}`);
  console.log(`${i+1}. [${t.date}] ${t.description} | ${parts.join(", ")}`);
});

// Chase style with 3 columns (debit, credit, balance)
const chase3ColText = `
Chase Bank
Statement Period: 01/01/2026 - 01/31/2026

01/02/2026 Walmart Purchase $45.99 $0.00 $4,954.01
01/03/2026 Salary Deposit $0.00 $3,500.00 $8,454.01
01/05/2026 Netflix $15.99 $0.00 $8,438.02
`;

console.log("\n=== Chase 3-Column Format (debit, credit, balance) ===");
const result3 = parseRuleBased(chase3ColText);
console.log(`Found ${result3.length} transactions (expected: 3):`);
result3.forEach((t, i) => {
  const parts = [];
  if (t.debit != null) parts.push(`Dr: $${t.debit}`);
  if (t.credit != null) parts.push(`Cr: $${t.credit}`);
  if (t.balance != null) parts.push(`Bal: $${t.balance}`);
  console.log(`${i+1}. [${t.date}] ${t.description} | ${parts.join(", ")}`);
});

console.log("\n=== Parser test complete ===");