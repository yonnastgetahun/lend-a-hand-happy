import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: May 2026
        </p>

        <div className="space-y-10 text-earth-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              1. What Lendlee Is
            </h2>
            <p>
              Lendlee is a personal lending tracker that helps you keep track of
              items you lend to and borrow from people you already know. Lendlee
              is not a marketplace, rental platform, or escrow service. We do not
              facilitate transactions between strangers or handle payments of any
              kind.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              2. Your Responsibilities
            </h2>
            <p className="mb-3">By using Lendlee, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                Provide accurate information about items and lending activity
              </li>
              <li>
                Use the app only for its intended purpose — tracking personal
                lending between people you know
              </li>
              <li>
                Not use Lendlee to harass, intimidate, or pressure others about
                returning items
              </li>
              <li>
                Not attempt to reverse-engineer, copy, or misuse any part of the
                service
              </li>
              <li>Comply with all applicable laws in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              3. Intellectual Property
            </h2>
            <p className="mb-3">
              Lendlee and its original content, features, and functionality are
              owned by Lendlee and are protected by copyright, trademark, and
              other intellectual property laws.
            </p>
            <p>
              You retain full ownership of the data you enter into Lendlee. We do
              not claim any rights to your personal lending records, contacts, or
              any other information you provide.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              4. Limitation of Liability
            </h2>
            <p className="mb-3">
              Lendlee is a tracking tool, not a guarantee. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                We do not guarantee that items lent between users will be returned
              </li>
              <li>
                We are not responsible for the condition, value, or return of any
                items tracked in the app
              </li>
              <li>
                We are not liable for any disputes between users regarding lent or
                borrowed items
              </li>
              <li>
                The service is provided "as is" without warranties of any kind,
                express or implied
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              5. Account Termination
            </h2>
            <p className="mb-3">
              You may delete your account at any time through the app. Upon
              deletion, your data will be permanently removed from our systems.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these terms or engage in abusive behavior. We will make reasonable
              efforts to notify you before taking such action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              6. Changes to These Terms
            </h2>
            <p>
              We may update these terms from time to time. If we make significant
              changes, we will notify you through the app or by email. Continued
              use of Lendlee after changes are posted constitutes your acceptance
              of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              7. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the
              laws of the United States, without regard to conflict of law
              principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              8. Contact Us
            </h2>
            <p>
              Questions about these terms? Reach us at{" "}
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

export default Terms;
