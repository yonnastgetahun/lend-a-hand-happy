import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
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
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">
              Terms of Service
            </h1>
          </div>

          <div className="space-y-6 text-earth-light leading-relaxed">
            <p>
              Lendlee is provided "as is" for personal use.
            </p>
            <p>
              The app helps you track items you lend; it does not guarantee the return of any item.
            </p>
            <p>
              You are responsible for your own lending decisions and interactions.
            </p>
            <p>
              We reserve the right to update the app and these terms at any time.
            </p>
            <p>
              By using Lendlee, you agree to these terms.
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

export default Terms;
