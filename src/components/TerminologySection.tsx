import { motion } from "framer-motion";

import { useI18n } from "@/hooks/useI18n";
import { domainAssumptions, productTerminology } from "@/lib/product-language";

const TerminologySection = () => {
  const { t } = useI18n();

  return (
    <section id="terminology" className="relative py-28">
      <div className="container mx-auto px-6">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                {t("landing.terminology.badge")}
              </span>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
                {t("landing.terminology.title")}
              </h2>
            </div>

            <div className="grid gap-4">
              {productTerminology.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
                    {t(item.termKey)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(item.definitionKey)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                {t("landing.terminology.assumptionsBadge")}
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">
                {t("landing.terminology.assumptionsTitle")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("landing.terminology.assumptionsDescription")}
              </p>
            </div>

            <div className="grid gap-4">
              {domainAssumptions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">{t(item.assumptionKey)}</p>
                    <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t(`product.assumption.classification.${item.classification}`)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(item.noteKey)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TerminologySection;
