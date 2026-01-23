import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const StartingSmall = () => {
  return (
    <section className="py-24 md:py-32 bg-warm-white">
      <div className="container px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-sage-light flex items-center justify-center mx-auto mb-8">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>

            {/* Content */}
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Starting with books
            </h2>
            <p className="text-lg text-earth-light leading-relaxed mb-8">
              We're beginning with what people share most: books. Dog-eared novels passed between friends. Cookbooks borrowed for a dinner party. Kids' books circulating through the neighborhood.
            </p>
            <p className="text-lg text-earth-light leading-relaxed mb-8">
              Books are personal. They carry stories within stories—the notes in margins, the coffee stains, the memories of who gave them to us. That's why they're the perfect place to start.
            </p>

            {/* Quote */}
            <motion.blockquote
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-2xl bg-secondary/50 border-l-4 border-primary"
            >
              <p className="font-serif text-xl text-foreground italic mb-4">
                "A book is meant to be shared. Lendlee helps it find its way home."
              </p>
              <footer className="text-sm text-earth-light">— Our founding belief</footer>
            </motion.blockquote>

            {/* Coming soon hint */}
            <p className="mt-8 text-muted-foreground text-sm">
              Tools, kitchen items, and more coming soon—one thoughtful category at a time.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StartingSmall;
