import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Terms of Service — Bank Statement Converter" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This is a template terms of service. Replace it with your own terms before
        going live.
      </p>
      <div className="prose mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          By using Bank Statement Converter you agree to use the service only for
          statements you have the right to process, and to comply with all
          applicable laws.
        </p>
        <p>
          The service is provided &quot;as is&quot; without warranties of any
          kind. AI-extracted data may contain errors and should be reviewed before
          relying on it for financial or tax decisions.
        </p>
        <p>
          For questions about these terms, contact
          support@bankstatementconverter.com.
        </p>
      </div>
      <Button asChild variant="ghost" size="sm" className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
