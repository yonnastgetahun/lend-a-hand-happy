import { motion } from "framer-motion";

const Problem = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6 },
  };

  return (
    <section className="py-24 md:py-32 bg-warm-white">
      <div className="container px-6">
        <div className="max-w-3xl mx-auto">
          {/* Poetic opening */}
          <motion.div {...fadeInUp} className="text-center mb-16">
            <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed italic">
              "You meant to return it.
              <br />
              They meant to remind you.
              <br />
              Life happened."
            </p>
          </motion.div>

          {/* Problem description */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="space-y-6 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              Lending is generous. Forgetting is human.
            </h2>
            <p className="text-lg text-earth-light leading-relaxed max-w-2xl mx-auto">
              We share books, tools, and treasures with people we care about. But when things slip through the cracks, small gifts become awkward silences. Neither person wants to bring it up. Trust gets a tiny crack.
            </p>
          </motion.div>

          {/* Emotional pain points */}
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {[
              {
                emoji: "😅",
                title: "The awkward ask",
                description: "\"Hey, do you still have my...?\" The question you've been avoiding for months.",
              },
              {
                emoji: "😔",
                title: "The quiet resentment",
                description: "You miss the item. You don't want to seem petty. So you say nothing.",
              },
              {
                emoji: "🤐",
                title: "The friendship fade",
                description: "It wasn't a big deal—until it became one. Now things feel... different.",
              },
              {
                emoji: "😕",
                title: "The accidental keeping",
                description: "Sometimes we forget we even have something that belongs to someone else.",
              },
              {
                emoji: "💚",
                title: "The easy return",
                description: "When it comes back naturally. No stress. Just gratitude.",
              },
            ].map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-secondary/50 border border-border"
              >
                <span className="text-3xl mb-3 block">{point.emoji}</span>
                <h3 className="font-serif text-lg text-foreground mb-2">{point.title}</h3>
                <p className="text-earth-light text-sm leading-relaxed">{point.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Closing */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-16 text-lg text-earth-light"
          >
            Generosity shouldn't cost friendships.
            <br />
            <span className="text-primary font-medium">There's a gentler way.</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default Problem;
