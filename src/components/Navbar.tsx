import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "@/hooks/useI18n";

const navLinks = [
  { key: "landing.link.procedures", href: "#platform" },
  { key: "landing.link.routeMap", href: "#route-map" },
  { key: "landing.link.terminology", href: "#terminology" },
  { key: "landing.link.technology", href: "#technology" },
];

const Navbar = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const brandIconSrc = `${import.meta.env.BASE_URL}favicon.svg`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <img src={brandIconSrc} alt={t("landing.brandAlt")} className="h-6 w-6" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Operio
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t(link.key)}
            </a>
          ))}
          <Link
            to="/app"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_20px_hsl(175_80%_50%/0.3)]"
          >
            {t("landing.nav.openApp")}
          </Link>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-foreground"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 p-6">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t(link.key)}
              </a>
            ))}
            <Link
              to="/app"
              className="rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              {t("landing.nav.openApp")}
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
