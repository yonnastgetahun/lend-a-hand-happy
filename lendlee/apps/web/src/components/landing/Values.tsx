import { motion } from "framer-motion";
import { Leaf, CircleDot, Shield, Sparkles, HandHeart } from "lucide-react";

const Values = () => {
  const values = [
    {
      icon: HandHeart,
      title: "Mutual aid",
      description: "We believe in neighbors helping neighbors. Sharing is how communities thrive.",
    },
    {
      icon: CircleDot,
      title: "Circular generosity",
      description: "What goes around comes around—when we remember. Lendlee closes the loop.",
    },
    {
      icon: Shield,
      title: "Trust",
      description: "Relationships are more valuable than things. We protect what matters most.",
    },
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Sharing means less buying, less waste, more connection. Good for people and planet.",
    },
    {
      icon: Sparkles,
      title: "Care",
      description: "Every feature is designed with kindness. Technology can be gentle.",
    },
  ];

  return (
    <section className="py-24 md:py-32 gradient-terracotta">
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              Our Values
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Inspired by Buy Nothing.
              <br />
              Built for community.
            </h2>
            <p className="text-lg text-earth-light max-w-2xl mx-auto leading-relaxed">
              Lendlee grows from the same soil as the Buy Nothing movement and neighborhood mutual aid. We believe in a world where sharing is natural, generosity flows freely, and nothing gets lost—including trust.
            </p>
          </motion.div>

          {/* Values grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`p-6 rounded-2xl bg-warm-white/80 backdrop-blur-sm border border-border/50 ${
                  index === 4 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-terracotta-light flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">{value.title}</h3>
                <p className="text-earth-light text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;
