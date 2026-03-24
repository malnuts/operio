import { motion } from "framer-motion";

const stats = [
  { value: "10,000+", label: "Simulated Procedures", sub: "completed in beta" },
  { value: "47%", label: "Faster Skill Acquisition", sub: "vs. traditional training" },
  { value: "99.7%", label: "Anatomical Accuracy", sub: "tissue-level fidelity" },
  { value: "12", label: "Partner Institutions", sub: "across 6 countries" },
];

const StatsSection = () => {
  return (
    <section id="impact" className="relative py-24 border-y border-border">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-4xl md:text-5xl font-bold text-primary text-glow mb-2">
                {stat.value}
              </p>
              <p className="font-semibold text-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground font-mono">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
