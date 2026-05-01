import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <main className="min-h-screen gradient-warm">
      <div className="container px-6 py-16 max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-earth-light hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: May 2026
        </p>

        <div className="space-y-10 text-earth-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">Overview</h2>
            <p>
              Lendlee ("we", "us", "our") operates the Lendlee mobile application
              and website at lendlee.app. This Privacy Policy explains what
              information we collect, how we use it, and your rights regarding your
              data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Information We Collect
            </h2>
            <p className="mb-3">We collect only what's needed to make Lendlee work:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-foreground">Account information</strong> —
                your name and email address, provided during sign-up.
              </li>
              <li>
                <strong className="text-foreground">Lending activity</strong> —
                items you lend or borrow, and associated dates.
              </li>
              <li>
                <strong className="text-foreground">Contacts</strong> — only when
                you explicitly grant permission, and only to help you select a
                borrower. We never upload or store your full contact list.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Information We Do NOT Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Your full contact list is never uploaded to our servers.</li>
              <li>We do not use third-party analytics or ad tracking services.</li>
              <li>We do not sell, rent, or share your data with advertisers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Authentication
            </h2>
            <p>
              You can sign in with Apple Sign-In, Google Sign-In, or
              email/password. When using Apple or Google, we receive only the
              information you authorize (typically name and email). We do not
              receive or store your Apple or Google account password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Data Storage & Security
            </h2>
            <p>
              Your data is stored securely using Supabase, hosted in a US-based
              data center. We use industry-standard encryption in transit (TLS) and
              at rest. Access to production data is strictly limited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Your Rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>
                Delete your account and all associated data at any time by
                contacting us.
              </li>
              <li>Export your data in a portable format.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Children's Privacy
            </h2>
            <p>
              Lendlee is not directed at children under 13. We do not knowingly
              collect personal information from children under 13. If you believe a
              child under 13 has provided us with personal data, please contact us
              and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. We will notify you of
              significant changes through the app or by email. Continued use of
              Lendlee after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">Contact Us</h2>
            <p>
              Questions or requests? Reach us at{" "}
              <a
                href="mailto:hello@lendlee.app"
                className="text-primary hover:underline"
              >
                hello@lendlee.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
