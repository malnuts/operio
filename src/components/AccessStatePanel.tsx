import { Link } from "react-router-dom";

import { useI18n } from "@/hooks/useI18n";
import {
  getAccessSurfaceClassName,
  normalizeContentVisibility,
} from "@/lib/content-access";
import { cn } from "@/lib/utils";
import type { ContentVisibility } from "@/types/content";

import AccessStateBadge from "./AccessStateBadge";

type AccessStatePanelProps = {
  visibility?: ContentVisibility | null;
  className?: string;
  showPricingLink?: boolean;
  variant?: "summary" | "detail";
};

const AccessStatePanel = ({
  visibility,
  className,
  showPricingLink = false,
  variant = "summary",
}: AccessStatePanelProps) => {
  const { t } = useI18n();
  const normalizedVisibility = normalizeContentVisibility(visibility);

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-sm",
        getAccessSurfaceClassName(normalizedVisibility),
        className,
      )}
    >
      {variant === "summary" ? (
        <>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t("pricing.library.accessLabel")}
          </p>
          <p className="mt-2 leading-6 text-muted-foreground">
            {t(`pricing.visibility.${normalizedVisibility}.description`)}
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <AccessStateBadge visibility={normalizedVisibility} />
            <span className="font-medium text-foreground">
              {t(`pricing.visibility.${normalizedVisibility}.scope`)}
            </span>
          </div>
          <p className="mt-2 leading-6 text-muted-foreground">
            {t(`pricing.visibility.${normalizedVisibility}.description`)}
          </p>
          {showPricingLink ? (
            <Link to="/pricing" className="mt-3 inline-flex font-medium text-primary hover:underline">
              {t("pricing.link.label")}
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AccessStatePanel;
