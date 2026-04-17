import { motion } from "framer-motion";
import { Plus, User, Clock, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Plus,
      step: "1",
      title: "Add an item",
      description: "Snap a photo or type a title. Books, tools, camping gear—whatever you're sharing.",
    },
    {
      icon: User,
      step: "2",
      title: "Choose a person",
      description: "Pick who's borrowing. They can join too, or not—it works either way.",
    },
    {
      icon: Clock,
      step: "3",
      title: "Set a gentle reminder",
      description: "Choose when you'd like a quiet nudge. A week? A month? Whenever feels right.",
    },
    {
      icon: CheckCircle,
      step: "4",
      title: "Return & close the loop",
      description: "When it comes back, mark it returned. Simple. No fuss. Relationship preserved. And generosity keeps flowing.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-warm-white">
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
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Four simple steps
            </h2>
            <p className="text-lg text-earth-light max-w-xl mx-auto">
              No learning curve. No complicated setup. Just a clear, kind way to keep track.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

            <div className="space-y-8 md:space-y-0">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative md:grid md:grid-cols-2 md:gap-8 items-center ${
                    index % 2 === 0 ? "" : "md:direction-rtl"
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`p-6 md:p-8 rounded-2xl bg-secondary/30 border border-border ${
                      index % 2 === 0 ? "md:text-right" : "md:text-left md:col-start-2"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-4 mb-4 ${
                        index % 2 === 0 ? "md:flex-row-reverse" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-primary">Step {item.step}</span>
                    </div>
                    <h3 className="font-serif text-xl text-foreground mb-2">{item.title}</h3>
                    <p className="text-earth-light">{item.description}</p>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-warm-white shadow-soft" />

                  {/* Empty column for alternating layout */}
                  {index % 2 === 0 ? <div className="hidden md:block" /> : null}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
