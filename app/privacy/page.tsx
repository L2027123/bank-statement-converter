import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Privacy Policy — Bank Statement Converter" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This is a template privacy policy. Replace it with your own terms before
        going live.
      </p>
      <div className="prose mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          We take your financial data seriously. Uploaded PDF bank statements are
          stored temporarily in a private Supabase Storage bucket accessible only
          to your account, processed to generate an Excel export, and can be
          deleted at any time from your dashboard.
        </p>
        <p>
          We do not sell your data. Transaction data extracted by the AI parser is
          stored only so you can re-download your Excel file.
        </p>
        <p>
          For questions about this policy, contact
          support@bankstatementconverter.com.
        </p>
      </div>
      <Button asChild variant="ghost" size="sm" className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
