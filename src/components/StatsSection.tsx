import { motion } from "framer-motion";
import { useI18n } from "@/hooks/useI18n";

const stats = [
  { value: "3", key: "contentTypes" },
  { value: "11", key: "routes" },
  { value: "5", key: "terms" },
  { value: "1", key: "verticals" },
];

const StatsSection = () => {
  const { t } = useI18n();

  return (
    <section id="impact" className="relative py-24 border-y border-border">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-4xl md:text-5xl font-bold text-primary text-glow mb-2">
                {stat.value}
              </p>
              <p className="font-semibold text-foreground text-sm mb-1">{t(`landing.stats.${stat.key}.label`)}</p>
              <p className="text-xs text-muted-foreground font-mono">{t(`landing.stats.${stat.key}.sub`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
