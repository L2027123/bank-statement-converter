import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Privacy Policy — Bank Statement Converter" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

      <div className="prose mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
          <p>
            We take your financial data seriously. Uploaded PDF bank statements are
            stored temporarily in a private Supabase Storage bucket accessible only
            to your account, processed to generate an Excel/CSV export, and can be
            deleted at any time from your dashboard.
          </p>
          <p>
            We do not sell your data. Transaction data extracted by the AI parser is
            stored only so you can re-download your Excel file.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. AI Processing Disclosure</h2>
          <p>
            To extract structured data from your uploaded bank statement PDFs, we use
            artificial intelligence (AI) services.
          </p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <strong>What we send:</strong> Only the text extracted from your PDF
              (not the original PDF file) is sent to our AI provider for parsing.
            </li>
            <li>
              <strong>Current provider:</strong> We currently use DeepSeek API for text
              parsing. DeepSeek may process data internationally. We do not use your
              data to train AI models.
            </li>
            <li>
              <strong>Your control:</strong> If you require US-only data processing
              for compliance reasons, please contact us at
              {" "}
              <a href="mailto:junliang2027@outlook.com" className="text-brand hover:underline">
                junliang2027@outlook.com
              </a>.
            </li>
            <li>
              <strong>Data retention:</strong> Extracted text is processed in
              real-time and not retained by the AI provider beyond the immediate
              parsing request.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Data We Collect</h2>
          <ul className="ml-4 list-disc space-y-2">
            <li>Account email address (for authentication)</li>
            <li>Uploaded PDF bank statements (for processing)</li>
            <li>Generated Excel/CSV files (for re-download)</li>
            <li>Usage data (page views, session ID — for analytics)</li>
            <li>Contact form submissions (name, email, message)</li>
            <li>Waitlist email (if you join the waitlist)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
          <p>We use the following third-party services to operate our product:</p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <strong>Supabase</strong> (Netherlands/US) — Database, authentication,
              and file storage.
            </li>
            <li>
              <strong>DeepSeek</strong> (international) — AI-powered text parsing.
            </li>
            <li>
              <strong>Vercel</strong> (US) — Web hosting and deployment.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data.
            To exercise these rights, contact us at
            {" "}
            <a href="mailto:junliang2027@outlook.com" className="text-brand hover:underline">
              junliang2027@outlook.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
          <p>
            For questions about this policy, contact
            {" "}
            <a href="mailto:junliang2027@outlook.com" className="text-brand hover:underline">
              junliang2027@outlook.com
            </a>.
          </p>
        </section>
      </div>
      <Button asChild variant="ghost" size="sm" className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
