import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BANKS, getBank, type BankInfo } from "@/lib/banks";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ bankName: string }>;
}

/**
 * 预生成所有银行页面（SSG）
 */
export function generateStaticParams() {
  return BANKS.map((b) => ({ bankName: b.slug }));
}

/**
 * 每个银行页面的 SEO metadata
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bankName } = await params;
  const bank = getBank(bankName);
  if (!bank) {
    return { title: "Bank not found" };
  }
  const title = `${bank.name} Bank Statement to Excel Converter`;
  const description = `Convert ${bank.name} PDF statements to Excel in seconds. AI-powered parser handles ${bank.fullName} ${bank.statementTypes.join(
    ", "
  ).toLowerCase()} statements — no manual data entry.`;
  return {
    title,
    description,
    alternates: { canonical: `/bank/${bank.slug}` },
  };
}

/**
 * 痛点描述（根据银行特色动态生成）
 */
function painPoints(bank: BankInfo): string[] {
  return [
    `${bank.fullName} PDF statements cannot be copy-pasted cleanly into Excel — the layout breaks, columns misalign, and balances land in the wrong row.`,
    bank.formatNote,
    `Manually retyping transactions from a ${bank.name} statement into a spreadsheet takes 30+ minutes per statement and is error-prone — a single miscopied digit throws off your entire reconciliation.`,
    `Multi-page ${bank.name} statements split tables awkwardly, so partial pastes leave you with mismatched dates, descriptions, and amounts across rows.`,
    `Accountants and bookkeepers processing multiple ${bank.name} ${bank.statementTypes.join(
      ", "
    ).toLowerCase()} statements per client waste hours per week on this exact problem.`,
  ];
}

/**
 * FAQ（根据银行特色动态生成）
 */
function faqs(bank: BankInfo): { q: string; a: string }[] {
  return [
    {
      q: `Does the tool support ${bank.name} ${bank.statementTypes
        .slice(0, 2)
        .join(" and ")} statements?`,
      a: `Yes. We support ${bank.fullName} ${bank.statementTypes
        .map((t) => t.toLowerCase())
        .join(", ")} statements. Just upload the PDF — our AI parser automatically detects the layout and extracts every transaction.`,
    },
    {
      q: `What does a ${bank.name} PDF statement look like?`,
      a: bank.formatNote,
    },
    {
      q: `How accurate is the ${bank.name} statement parser?`,
      a: `Our AI parser achieves 99%+ accuracy on ${bank.name} statements. Every transaction's date, description, debit, credit, and balance is extracted and verified. If anything looks wrong in the preview, you can re-run the parser for free.`,
    },
    {
      q: `Is the ${bank.name} PDF upload secure?`,
      a: `Yes. Your ${bank.name} statement is uploaded over HTTPS, processed in an isolated session, and deleted immediately after the Excel file is generated. We do not store your statement or share it with any third party. You can delete your history at any time.`,
    },
    {
      q: `How much does it cost to convert ${bank.name} statements to Excel?`,
      a: `Free for the first 3 conversions. After that, credit packs start at $5 (10 credits) — no monthly subscription, no auto-renew. One credit = one statement PDF. Credits never expire.`,
    },
  ];
}

export default async function BankLandingPage({ params }: PageProps) {
  const { bankName } = await params;
  const bank = getBank(bankName);
  if (!bank) {
    notFound();
  }

  const painList = painPoints(bank);
  const faqList = faqs(bank);
  const statementTypeLabel = bank.statementTypes.join(", ");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-brand"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-bold">
              B
            </span>
            Bank Statement Converter
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/upload?demo=true">Try Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 to-white" />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            {bank.fullName} · {statementTypeLabel}
          </span>
          <h1 className="mx-auto mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {bank.name} Bank Statement to Excel Converter
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Convert your {bank.name} PDF statement to a clean Excel file in
            seconds. AI-powered parser extracts every transaction — date,
            description, debit, credit, and balance — no manual data entry.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/upload?demo=true">Convert {bank.name} PDF →</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/#pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card required · 3 free conversions
          </p>
        </div>
      </section>

      {/* Pain points */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          The {bank.name} statement problem
        </h2>
        <p className="mt-3 text-muted-foreground">
          If you've ever tried to copy transactions from a {bank.name} PDF into
          Excel, you've hit these issues:
        </p>
        <ul className="mt-8 space-y-5">
          {painList.map((pain, i) => (
            <li key={i} className="flex gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <p className="text-sm text-muted-foreground sm:text-base">
                {pain}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Solution */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How our {bank.name} statement converter works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white font-bold">
                1
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                Upload your {bank.name} PDF
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag &amp; drop your {bank.name} statement PDF. Max 10 MB. We
                support {statementTypeLabel} statements.
              </p>
            </div>
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white font-bold">
                2
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                AI parses transactions
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our AI parser reads the {bank.name} layout and extracts every
                transaction's date, description, debit, credit, and balance.
              </p>
            </div>
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white font-bold">
                3
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                Download Excel
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get a clean .xlsx file with all transactions in a single sheet.
                Ready for Excel, Google Sheets, or your accounting software.
              </p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/upload?demo=true">
                Convert your {bank.name} statement →
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {bank.name} statement converter FAQ
        </h2>
        <div className="mt-8 space-y-6">
          {faqList.map((faq, i) => (
            <div key={i}>
              <h3 className="font-semibold text-foreground">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bank Statement Converter. Not
            affiliated with {bank.fullName}.
          </p>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-brand">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand">
              Terms of Service
            </Link>
            <Link href="/alternatives/bankstatementconverter" className="hover:text-brand">
              Compare
            </Link>
            <Link href="/" className="hover:text-brand">
              Back to home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
