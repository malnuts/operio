import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useI18n } from "@/hooks/useI18n";

type CreatorShellProps = {
  badge: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

const CreatorShell = ({ badge, title, description, actions, children }: CreatorShellProps) => {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t("creator.back")}
            </Link>
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              {badge}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {description}
              </p>
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-3">
              {actions}
            </div>
          ) : null}
        </div>

        {children}
      </div>
    </main>
  );
};

export default CreatorShell;
