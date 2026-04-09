import { useI18n } from "@/hooks/useI18n";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-primary/10 ring-1 ring-primary/20">
              <img src="/favicon.svg" alt={t("landing.brandAlt")} className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-foreground">Operio</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#platform" className="hover:text-primary transition-colors">{t("landing.link.procedures")}</a>
            <a href="#route-map" className="hover:text-primary transition-colors">{t("landing.link.routeMap")}</a>
            <a href="#terminology" className="hover:text-primary transition-colors">{t("landing.link.terminology")}</a>
            <a href="#technology" className="hover:text-primary transition-colors">{t("landing.link.technology")}</a>
            <a href="#contact" className="hover:text-primary transition-colors">{t("landing.link.contact")}</a>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("landing.footer.copyright", { year: String(new Date().getFullYear()) })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
