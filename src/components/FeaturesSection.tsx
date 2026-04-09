import { motion } from "framer-motion";
import { BookOpenText, FileText, ClipboardCheck } from "lucide-react";

import hapticImage from "@/assets/haptic-device.jpg";
import xrImage from "@/assets/xr-training.jpg";
import aiImage from "@/assets/ai-assessment.jpg";
import { useI18n } from "@/hooks/useI18n";

const features = [
  {
    icon: BookOpenText,
    key: "procedure",
    image: aiImage,
  },
  {
    icon: FileText,
    key: "post",
    image: hapticImage,
  },
  {
    icon: ClipboardCheck,
    key: "assessment",
    image: xrImage,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
};

const FeaturesSection = () => {
  const { t } = useI18n();

  return (
    <section id="platform" className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="font-mono text-xs text-primary tracking-widest uppercase">
            {t("landing.features.badge")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            {t("landing.features.titlePrefix")}{" "}
            <span className="gradient-text">{t("landing.features.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("landing.features.description")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.key}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:glow-box"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={feature.image}
                  alt={t(`landing.features.item.${feature.key}.title`)}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 text-foreground">
                  {t(`landing.features.item.${feature.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`landing.features.item.${feature.key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
