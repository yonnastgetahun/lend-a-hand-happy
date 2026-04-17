import { motion } from "framer-motion";
import { Bell, Heart, MessageCircle, RefreshCw } from "lucide-react";

const Solution = () => {
  const features = [
    {
      icon: Bell,
      title: "Gentle reminders",
      description: "Quiet nudges at the right time—for you, not them. No awkward automated messages.",
    },
    {
      icon: RefreshCw,
      title: "Mutual accountability",
      description: "Both parties see the same simple truth. No guessing, no assuming.",
    },
    {
      icon: MessageCircle,
      title: "No awkward conversations",
      description: "The app remembers so you don't have to ask. Just a soft prompt when it's time.",
    },
    {
      icon: Heart,
      title: "Relationship-first design",
      description: "Built to protect trust, not transactions. Care is always the priority.",
    },
  ];

  return (
    <section className="py-24 md:py-32 gradient-sage">
      <div className="container px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              The Lendlee Way
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Remember gently. Return joyfully.
            </h2>
            <p className="text-lg text-earth-light max-w-2xl mx-auto leading-relaxed">
              Lendlee creates a quiet, shared space for lending. No pressure, no nagging—just clarity and care. You stay connected. Your stuff finds its way home.
            </p>
          </motion.div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-8 rounded-2xl bg-warm-white shadow-soft hover:shadow-medium transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-sage-light flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-3">{feature.title}</h3>
                <p className="text-earth-light leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
