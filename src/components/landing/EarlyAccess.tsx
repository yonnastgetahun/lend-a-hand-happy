import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });

const EarlyAccess = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setStatus("error");
      setErrorMessage(result.error.errors[0].message);
      return;
    }

    // Simulate success (placeholder for actual integration)
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="py-24 md:py-32 gradient-sage">
      <div className="container px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Heart className="w-8 h-8 text-primary" />
            </div>

            {/* Content */}
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
              Join the community
            </h2>
            <p className="text-lg text-earth-light mb-10 max-w-lg mx-auto">
              We're building Lendlee with care, and we'd love you to be part of it from the start. No spam—just updates when we have something worth sharing.
            </p>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-md mx-auto"
            >
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-warm-white border border-primary/20 text-center"
                >
                  <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-foreground mb-2">Welcome to Lendlee!</h3>
                  <p className="text-earth-light">
                    We'll be in touch soon. Thank you for believing in community.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      className="h-12 rounded-xl bg-warm-white border-border focus:border-primary text-center sm:text-left"
                      aria-label="Email address"
                    />
                    <Button type="submit" size="lg" className="shrink-0">
                      Get Early Access
                    </Button>
                  </div>

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-destructive text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    No spam, ever. Unsubscribe anytime. We respect your inbox.
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EarlyAccess;
