import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { useI18n } from "@/hooks/useI18n";
import { productRoutes } from "@/lib/product-language";

const RouteMapSection = () => {
  const { t } = useI18n();

  return (
    <section id="route-map" className="relative border-y border-border py-28">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 max-w-3xl"
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            {t("landing.routeMap.badge")}
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {t("landing.routeMap.title")}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {t("landing.routeMap.description")}
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {productRoutes.map((route, index) => (
            <motion.div
              key={route.path}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
            >
              <Link
                to={route.path.replace(":id", "sample")}
                className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="font-display text-xl font-semibold text-foreground">{t(route.titleKey)}</p>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    {t(`product.audience.${route.audience}`)}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{route.path}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(route.summaryKey)}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RouteMapSection;
