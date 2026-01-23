import { motion } from "framer-motion";

const MicroStory = () => {
  return (
    <section className="py-24 md:py-32 bg-warm-white">
      <div className="container px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Subtle heading */}
            <p className="text-sm font-medium text-primary/70 mb-8 tracking-wide">
              A small moment. A big difference.
            </p>

            {/* Story text */}
            <div className="space-y-4 mb-8">
              <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed italic">
                "Sarah lent her favorite cookbook to a neighbor.
              </p>
              <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed italic">
                Three months later, Lendlee reminded them both.
              </p>
              <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed italic">
                It came back with a thank-you note inside.
              </p>
              <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed italic">
                Somewhere along the way, trust grew stronger."
              </p>
            </div>

            {/* Closing line */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm text-earth-light"
            >
              This is what gentle systems make possible.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MicroStory;
