import { motion } from "framer-motion";
import { Cpu, Database, Shield, Layers } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

const techItems = [
  {
    icon: Cpu,
    key: "playback",
  },
  {
    icon: Database,
    key: "progress",
  },
  {
    icon: Shield,
    key: "validation",
  },
  {
    icon: Layers,
    key: "reference",
  },
];

const TechnologySection = () => {
  const { t } = useI18n();

  return (
    <section id="technology" className="relative py-32">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-xs text-primary tracking-widest uppercase">
              {t("landing.technology.badge")}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
              {t("landing.technology.titlePrefix")} <span className="gradient-text">{t("landing.technology.titleHighlight")}</span> {t("landing.technology.titleSuffix")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t("landing.technology.description")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {techItems.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:glow-box"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon size={18} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1.5">{t(`landing.technology.item.${item.key}.title`)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(`landing.technology.item.${item.key}.description`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
