import { motion } from "framer-motion";

const stats = [
  { value: "3", label: "Core Content Types", sub: "procedures, posts, assessments" },
  { value: "11", label: "Mapped Product Routes", sub: "learner, creator, and pricing paths" },
  { value: "5", label: "Shared Product Terms", sub: "creator, learner, and content vocabulary" },
  { value: "1", label: "Launch Vertical", sub: "kept narrow without narrowing the platform" },
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
