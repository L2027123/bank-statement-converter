/**
 * Major US banks covered by Bank Statement Converter's SEO landing pages.
 * Each entry powers a dedicated page at /bank/[slug].
 */

export interface BankInfo {
  slug: string;
  name: string; // 短名 "Chase"
  fullName: string; // 完整名 "JPMorgan Chase Bank, N.A."
  formatNote: string; // 对账单格式特点（用于 painPoints + FAQ）
  statementTypes: string[]; // 支持的对账单类型
}

export const BANKS: BankInfo[] = [
  {
    slug: "chase",
    name: "Chase",
    fullName: "JPMorgan Chase Bank, N.A.",
    formatNote:
      "Chase issues PDF statements in a single-column layout with date, description, and amount columns. Debits and credits are mixed in one amount column, distinguished only by sign or surrounding parentheses.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "wells-fargo",
    name: "Wells Fargo",
    fullName: "Wells Fargo Bank, N.A.",
    formatNote:
      "Wells Fargo uses a two-column format with separate Withdrawals and Deposits columns, plus a running balance column. This layout is notoriously hard to copy-paste cleanly into Excel.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "bank-of-america",
    name: "Bank of America",
    fullName: "Bank of America, N.A.",
    formatNote:
      "Bank of America statements show transactions in a tabular format with separate Amount and Balance columns, often grouped by statement period. Multi-page statements can split tables across pages.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "citi",
    name: "Citi",
    fullName: "Citibank, N.A.",
    formatNote:
      "Citi statements vary by product: checking statements use a single amount column with sign indicators, while credit card statements separate Purchases, Payments, and Fees into distinct sections.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "capital-one",
    name: "Capital One",
    fullName: "Capital One, N.A.",
    formatNote:
      "Capital One 360 statements list transactions with date, description, and amount, often mixing debit card, ACH, and interest transactions in a single column. Credit card statements follow a different layout.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "us-bank",
    name: "U.S. Bank",
    fullName: "U.S. Bank National Association",
    formatNote:
      "U.S. Bank statements use a transaction table with separate Withdrawal and Deposit columns, similar to Wells Fargo. Multi-page statements include running balances per page.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "truist",
    name: "Truist",
    fullName: "Truist Bank",
    formatNote:
      "Truist (formed from BB&T and SunTrust merger) statements use a single-column format with sign-indicated amounts. Some legacy statements may still show former bank branding.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "pnc",
    name: "PNC Bank",
    fullName: "PNC Bank, N.A.",
    formatNote:
      "PNC statements present transactions in a tabular layout with separate Withdrawals and Deposits columns. Account summaries are at the top, transactions below.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "td-bank",
    name: "TD Bank",
    fullName: "TD Bank, N.A.",
    formatNote:
      "TD Bank statements use a single-column transaction format with sign-indicated amounts. Cross-border customers may receive statements in both USD and CAD formats.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "fifth-third",
    name: "Fifth Third Bank",
    fullName: "Fifth Third Bank, N.A.",
    formatNote:
      "Fifth Third Bank statements use a two-column layout with separate Withdrawals and Deposits, plus a running balance. Some business accounts include check image attachments.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "santander",
    name: "Santander",
    fullName: "Santander Bank, N.A.",
    formatNote:
      "Santander statements list transactions with date, description, and amount columns. International transfers may appear with both USD and original currency amounts.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "keybank",
    name: "KeyBank",
    fullName: "KeyBank National Association",
    formatNote:
      "KeyBank statements use a single-column format with debit/credit indicators. Business statements often include additional reference and memo columns.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "regions",
    name: "Regions Bank",
    fullName: "Regions Bank",
    formatNote:
      "Regions Bank statements present transactions in a tabular format with separate Withdrawals and Deposits columns, plus running balance per transaction.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "mt-bank",
    name: "M&T Bank",
    fullName: "M&T Bank",
    formatNote:
      "M&T Bank statements use a two-column layout with separate Withdrawals and Deposits. Multi-page statements include a summary box at the top of each page.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "ally",
    name: "Ally Bank",
    fullName: "Ally Bank",
    formatNote:
      "Ally Bank (online-only) statements list transactions in a single column with date, description, and amount. No physical checks, but ACH and debit card transactions dominate.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "discover",
    name: "Discover",
    fullName: "Discover Bank",
    formatNote:
      "Discover statements vary by product: credit card statements show transactions grouped by category, while checking statements use a single-column tabular layout.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "amex",
    name: "American Express",
    fullName: "American Express National Bank",
    formatNote:
      "Amex statements primarily cover credit card accounts, with transactions grouped by statement period. Charges appear with merchant name, amount, and category.",
    statementTypes: ["Credit Card", "Savings"],
  },
  {
    slug: "hsbc",
    name: "HSBC",
    fullName: "HSBC Bank USA, N.A.",
    formatNote:
      "HSBC statements list transactions with date, description, and amount columns. International accounts may show multi-currency transactions with conversion rates.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "barclays",
    name: "Barclays",
    fullName: "Barclays Bank Delaware",
    formatNote:
      "Barclays primarily issues credit card statements in the US, with transactions grouped by statement period and category breakdowns at the bottom.",
    statementTypes: ["Credit Card", "Savings"],
  },
  {
    slug: "paypal",
    name: "PayPal",
    fullName: "PayPal, Inc.",
    formatNote:
      "PayPal statements list transactions with date, type, name, and net amount. Activity types include payments received, payments sent, fees, and transfers.",
    statementTypes: ["Business Account", "Personal Account"],
  },
  {
    slug: "stripe",
    name: "Stripe",
    fullName: "Stripe, Inc.",
    formatNote:
      "Stripe statements list payouts, charges, refunds, and fees with date, description, and net amount. Statements are typically exportable as CSV or PDF.",
    statementTypes: ["Payout Account"],
  },
  {
    slug: "schwab",
    name: "Charles Schwab",
    fullName: "Charles Schwab Bank, SSB",
    formatNote:
      "Schwab statements combine banking and brokerage activity. Checking transactions appear in a tabular format, while investment positions appear separately.",
    statementTypes: ["Checking", "Brokerage", "IRA"],
  },
  {
    slug: "fidelity",
    name: "Fidelity",
    fullName: "Fidelity Investments",
    formatNote:
      "Fidelity statements cover investment accounts, brokerage activity, and cash management. Transactions are grouped by type (buys, sells, dividends, transfers).",
    statementTypes: ["Brokerage", "Cash Management", "IRA", "401k"],
  },
  {
    slug: "morgan-stanley",
    name: "Morgan Stanley",
    fullName: "Morgan Stanley Smith Barney LLC",
    formatNote:
      "Morgan Stanley statements focus on investment accounts, with transactions grouped by security. Cash transactions appear separately from security positions.",
    statementTypes: ["Brokerage", "Investment Account"],
  },
  {
    slug: "goldman-sachs",
    name: "Goldman Sachs",
    fullName: "Goldman Sachs Bank USA",
    formatNote:
      "Goldman Sachs consumer statements (Marcus) list transactions in a single-column format with date, description, and amount. Investment statements follow a different layout.",
    statementTypes: ["Savings", "Brokerage"],
  },
  {
    slug: "usbank",
    name: "U.S. Bancorp",
    fullName: "U.S. Bancorp",
    formatNote:
      "U.S. Bancorp parent of U.S. Bank. Corporate and subsidiary statements may vary in format. Personal statements follow U.S. Bank's standard layout.",
    statementTypes: ["Checking", "Savings"],
  },
  {
    slug: "citizens",
    name: "Citizens Bank",
    fullName: "Citizens Bank, N.A.",
    formatNote:
      "Citizens Bank statements use a single-column transaction layout with separate Withdrawals and Deposits columns and a running balance per entry.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "comerica",
    name: "Comerica Bank",
    fullName: "Comerica Bank",
    formatNote:
      "Comerica statements often target business customers, with transaction tables including reference numbers, check numbers, and detailed memo fields.",
    statementTypes: ["Business Checking", "Savings", "Treasury Management"],
  },
  {
    slug: "huntington",
    name: "Huntington Bank",
    fullName: "The Huntington National Bank",
    formatNote:
      "Huntington Bank statements use a tabular layout with separate Withdrawals and Deposits columns. Personal statements include spending summary at the top.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "bmo",
    name: "BMO",
    fullName: "BMO Harris Bank N.A.",
    formatNote:
      "BMO (formerly BMO Harris) statements use a single-column format with sign-indicated amounts. Recent rebranding may cause statements to show transitional branding.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "zions",
    name: "Zions Bank",
    fullName: "Zions Bancorporation, N.A.",
    formatNote:
      "Zions Bank statements present transactions in a tabular layout with separate Withdrawals and Deposits columns. Western US-focused with regional business accounts.",
    statementTypes: ["Checking", "Savings", "Business Loan"],
  },
  {
    slug: "synovus",
    name: "Synovus Bank",
    fullName: "Synovus Bank",
    formatNote:
      "Synovus Bank statements use a single-column format with debit/credit indicators. Southeastern US regional bank with personal and business account types.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "first-republic",
    name: "First Republic Bank",
    fullName: "First Republic Bank (now JPMorgan Chase)",
    formatNote:
      "First Republic Bank was acquired by JPMorgan Chase in 2023. Legacy statements follow First Republic's format; new customers receive Chase-format statements.",
    statementTypes: ["Checking", "Savings", "Wealth Management"],
  },
  {
    slug: "silicon-valley-bank",
    name: "Silicon Valley Bank",
    fullName: "Silicon Valley Bank (now First Citizens)",
    formatNote:
      "Silicon Valley Bank was acquired by First Citizens in 2023. Legacy statements follow SVB's startup-focused format; new customers receive First Citizens statements.",
    statementTypes: ["Business Checking", "Venture Debt"],
  },
  {
    slug: "signature-bank",
    name: "Signature Bank",
    fullName: "Signature Bank (closed 2023, FDIC receiver)",
    formatNote:
      "Signature Bank was closed by NYDFS in 2023. Legacy statements are maintained by FDIC receiver. Customers were transitioned to other institutions.",
    statementTypes: ["Business Checking", "Digital Banking"],
  },
  {
    slug: "western-alliance",
    name: "Western Alliance Bank",
    fullName: "Western Alliance Bancorporation",
    formatNote:
      "Western Alliance Bank statements primarily serve business customers, with transaction tables including reference and memo fields. Regional focus on Western US.",
    statementTypes: ["Business Checking", "Treasury Management"],
  },
  {
    slug: "east-west-bank",
    name: "East West Bank",
    fullName: "East West Banking Corporation",
    formatNote:
      "East West Bank statements serve cross-border US-Asia customers. Multi-currency transactions may appear with conversion rates and original amounts.",
    statementTypes: ["Checking", "Savings", "International Banking"],
  },
  {
    slug: "cathay-bank",
    name: "Cathay Bank",
    fullName: "Cathay Bank",
    formatNote:
      "Cathay Bank statements serve Chinese-American communities and businesses. Multi-language statements may be available. Transactions use standard US format.",
    statementTypes: ["Checking", "Savings", "Business Loan"],
  },
  {
    slug: "bank-of-the-west",
    name: "Bank of the West",
    fullName: "Bank of the West (now BMO)",
    formatNote:
      "Bank of the West was acquired by BMO in 2023. Legacy statements follow Bank of the West's format; new customers receive BMO-format statements.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "union-bank",
    name: "Union Bank",
    fullName: "Union Bank (now U.S. Bank)",
    formatNote:
      "Union Bank was acquired by U.S. Bank in 2022. Legacy statements follow Union Bank's format; new customers receive U.S. Bank-format statements.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "california-bank",
    name: "California Bank & Trust",
    fullName: "California Bank & Trust (Zions)",
    formatNote:
      "California Bank & Trust (a Zions Bancorporation subsidiary) statements use Zions' standard format with regional branding for California customers.",
    statementTypes: ["Checking", "Savings", "Business Loan"],
  },
  {
    slug: "texas-capital",
    name: "Texas Capital Bank",
    fullName: "Texas Capital Bank",
    formatNote:
      "Texas Capital Bank statements primarily serve business customers, with detailed transaction tables including reference numbers and memo fields.",
    statementTypes: ["Business Checking", "Treasury Management", "Loan"],
  },
  {
    slug: "comenity",
    name: "Comenity Bank",
    fullName: "Comenity Bank",
    formatNote:
      "Comenity Bank issues co-branded and private label credit cards. Statements show transactions grouped by merchant with category breakdowns at the bottom.",
    statementTypes: ["Credit Card", "Store Card"],
  },
  {
    slug: "synchrony",
    name: "Synchrony Bank",
    fullName: "Synchrony Bank",
    formatNote:
      "Synchrony Bank issues co-branded store credit cards and high-yield savings. Statements vary significantly by product type.",
    statementTypes: ["Credit Card", "Savings", "Store Card"],
  },
  {
    slug: "penfed",
    name: "PenFed Credit Union",
    fullName: "Pentagon Federal Credit Union",
    formatNote:
      "PenFed Credit Union statements list transactions in a single-column format with sign-indicated amounts. Membership-based credit union serving military and government.",
    statementTypes: ["Checking", "Savings", "Credit Card", "Auto Loan"],
  },
  {
    slug: "navy-federal",
    name: "Navy Federal Credit Union",
    fullName: "Navy Federal Credit Union",
    formatNote:
      "Navy Federal Credit Union statements serve military members and families. Transactions appear in a tabular format with separate Withdrawals and Deposits columns.",
    statementTypes: ["Checking", "Savings", "Credit Card", "Auto Loan"],
  },
  {
    slug: "usaa",
    name: "USAA",
    fullName: "USAA Federal Savings Bank",
    formatNote:
      "USAA statements serve military members and families. Transactions appear in a single-column format with sign-indicated amounts. Insurance statements are separate.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "alliant",
    name: "Alliant Credit Union",
    fullName: "Alliant Credit Union",
    formatNote:
      "Alliant Credit Union (online-only) statements list transactions in a single-column format with date, description, and amount. No physical branches.",
    statementTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    slug: "marcus",
    name: "Marcus by Goldman Sachs",
    fullName: "Marcus by Goldman Sachs",
    formatNote:
      "Marcus (Goldman Sachs consumer brand) statements cover high-yield savings and personal loans. Transactions are simple: deposits, withdrawals, and interest.",
    statementTypes: ["High-Yield Savings", "Personal Loan"],
  },
  {
    slug: "sofi",
    name: "SoFi",
    fullName: "SoFi Bank, N.A.",
    formatNote:
      "SoFi statements cover checking, savings, and personal loans. Transactions list date, description, and amount in a single-column format with sign indicators.",
    statementTypes: ["Checking", "Savings", "Personal Loan"],
  },
  {
    slug: "chime",
    name: "Chime",
    fullName: "Chime (The Bancorp Bank or Stride Bank)",
    formatNote:
      "Chime is a neobank using partner banks (Bancorp, Stride). Statements list transactions in a simple single-column format with date, description, and amount.",
    statementTypes: ["Checking", "Savings", "Credit Builder"],
  },
  {
    slug: "varo",
    name: "Varo Bank",
    fullName: "Varo Bank, N.A.",
    formatNote:
      "Varo Bank (mobile-only neobank) statements list transactions in a single-column format with date, description, and amount. No physical branches.",
    statementTypes: ["Checking", "Savings"],
  },
  // European banks — IBAN / SEPA / VAT-aware parsing
  {
    slug: "deutsche-bank",
    name: "Deutsche Bank",
    fullName: "Deutsche Bank AG",
    formatNote:
      "Deutsche Bank statements list transactions with date, description, and amount in EUR. IBAN appears in the account header. VAT-registered businesses may see USt-ID and tax breakdowns.",
    statementTypes: ["Girokonto", "Sparkonto", "Kreditkarte"],
  },
  {
    slug: "barclays-uk",
    name: "Barclays UK",
    fullName: "Barclays Bank UK PLC",
    formatNote:
      "Barclays UK statements use GBP with date, description, and amount columns. Sort code and account number appear in the header. Business accounts include VAT and reference numbers.",
    statementTypes: ["Current Account", "Savings", "Credit Card"],
  },
  {
    slug: "hsbc-uk",
    name: "HSBC UK",
    fullName: "HSBC UK Bank plc",
    formatNote:
      "HSBC UK statements list transactions in GBP with date, payee, and amount. SEPA payments may appear with IBAN. Business statements include VAT breakdowns.",
    statementTypes: ["Current Account", "Savings", "Credit Card"],
  },
  {
    slug: "bunq",
    name: "Bunq",
    fullName: "Bunq B.V.",
    formatNote:
      "Bunq (Dutch neobank) statements are multilingual (NL/EN) with EUR transactions. Includes IBAN, BIC, and automatic VAT categorization for business accounts.",
    statementTypes: ["Bunq Easy Bank", "Bunq Premium", "Business Account"],
  },
  {
    slug: "ing",
    name: "ING",
    fullName: "ING Groep N.V.",
    formatNote:
      "ING Bank (Netherlands) statements use EUR with date, description, and amount. IBAN prominent in header. Business accounts include VAT and BTW numbers.",
    statementTypes: ["Rekening", "Spaarrekening", "Creditcard"],
  },
  {
    slug: "revolut",
    name: "Revolut",
    fullName: "Revolut Bank UAB",
    formatNote:
      "Revolut statements list transactions with merchant, amount, and currency. Supports multi-currency with automatic conversion. Business accounts include VAT extraction.",
    statementTypes: ["Personal", "Business", "Metal"],
  },
  {
    slug: "monzo",
    name: "Monzo",
    fullName: "Monzo Bank Limited",
    formatNote:
      "Monzo (UK neobank) statements use GBP with category-tagged transactions. Sort code and account number in header. Business accounts support VAT tracking.",
    statementTypes: ["Current Account", "Business Account", "Savings"],
  },
  {
    slug: "starling",
    name: "Starling",
    fullName: "Starling Bank Limited",
    formatNote:
      "Starling (UK) statements list transactions with category tags and amounts in GBP. Business accounts include automatic VAT categorization and MTD-compatible exports.",
    statementTypes: ["Personal", "Business", "Sole Trader"],
  },
  {
    slug: "n26",
    name: "N26",
    fullName: "N26 Bank AG",
    formatNote:
      "N26 (German neobank) statements use EUR with date, merchant, and amount. IBAN appears prominently. Tax statements include German VAT (Umsatzsteuer) for business accounts.",
    statementTypes: ["Standard", "Smart", "Business"],
  },
  {
    slug: "abn-amro",
    name: "ABN AMRO",
    fullName: "ABN AMRO Bank N.V.",
    formatNote:
      "ABN AMRO (Netherlands) statements use EUR with date, description, and amount columns. IBAN and BIC in header. Business accounts include BTW (VAT) numbers.",
    statementTypes: ["Rekening", "Spaarrekening", "Creditcard"],
  },
  {
    slug: "seb",
    name: "SEB",
    fullName: "SEB AB",
    formatNote:
      "SEB (Sweden) statements use SEK/EUR with date, description, and amount. IBAN and BIC in header. Business accounts include VAT (moms) breakdowns.",
    statementTypes: ["Privatkonto", "Företagskonto", "Kreditkort"],
  },
  {
    slug: "santander-uk",
    name: "Santander UK",
    fullName: "Santander UK plc",
    formatNote:
      "Santander UK statements use GBP with date, payee, and amount. Sort code in header. Business accounts include reference numbers and VAT.",
    statementTypes: ["Current Account", "Savings", "Credit Card"],
  },
  {
    slug: "caixabank",
    name: "CaixaBank",
    fullName: "CaixaBank, S.A.",
    formatNote:
      "CaixaBank (Spain) statements use EUR with date, descripción, and importe. IBAN in header. Business accounts include IVA (VAT) and CIF numbers.",
    statementTypes: ["Cuenta Corriente", "Ahorro", "Tarjeta de Crédito"],
  },
  {
    slug: "kbc",
    name: "KBC",
    fullName: "KBC Bank NV",
    formatNote:
      "KBC Bank (Belgium) statements use EUR with date, description, and amount. IBAN and BIC in header. Business accounts include TVA (VAT) numbers.",
    statementTypes: ["Zichtrekening", "Spaarrekening", "Creditcard"],
  },
];

/**
 * 获取某个银行的信息（slug 不存在返回 undefined）
 */
export function getBank(slug: string): BankInfo | undefined {
  return BANKS.find((b) => b.slug === slug);
}
