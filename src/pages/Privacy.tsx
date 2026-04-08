import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const Privacy = () => {
  return (
    <main className="min-h-screen bg-warm-white py-16 md:py-24">
      <div className="container px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">
              Privacy Policy
            </h1>
          </div>

          <div className="space-y-6 text-earth-light leading-relaxed">
            <p>
              Lendlee stores all data locally on your device using Apple's on-device storage.
            </p>
            <p>
              We do not collect, transmit, or store any personal data on external servers.
            </p>
            <p>
              Contact access is used solely to select a borrower name — contacts are never uploaded or shared.
            </p>
            <p>
              We do not use analytics, tracking pixels, or advertising SDKs.
            </p>
            <p>
              No account creation is required to use Lendlee.
            </p>
            <p>
              Lendlee does not communicate with any server. There is no backend.
            </p>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Last updated: April 8, 2026
          </p>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
