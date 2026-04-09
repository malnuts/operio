import { Link } from "react-router-dom";
import { ArrowLeft, Coins, GraduationCap, ShieldCheck, Store } from "lucide-react";

import AccessStateBadge from "@/components/AccessStateBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  contentVisibilityOrder,
  getAccessSurfaceClassName,
} from "@/lib/content-access";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils";
import type { ContentVisibility } from "@/types/content";

const tierIcons: Record<ContentVisibility, typeof GraduationCap> = {
  free: GraduationCap,
  paid: ShieldCheck,
  premium: Store,
};

const Pricing = () => {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("pricing.back")}
        </Link>

        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-8 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_36%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.16),transparent_36%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              <Coins className="h-3.5 w-3.5" />
              {t("pricing.badge")}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
                {t("pricing.title")}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {t("pricing.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/app">{t("pricing.action.learner")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/creator">{t("pricing.action.creator")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {contentVisibilityOrder.map((visibility) => {
            const TierIcon = tierIcons[visibility];

            return (
              <Card
                key={visibility}
                className={cn(
                  "h-full border-border/70 shadow-sm",
                  getAccessSurfaceClassName(visibility),
                )}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <AccessStateBadge visibility={visibility} />
                    <div className="rounded-2xl bg-background/80 p-3 text-foreground shadow-sm">
                      <TierIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <CardTitle>{t(`pricing.visibility.${visibility}.scope`)}</CardTitle>
                    <CardDescription className="text-sm leading-6 text-muted-foreground">
                      {t(`pricing.visibility.${visibility}.description`)}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-4xl font-semibold tracking-tight">
                    {t(`pricing.visibility.${visibility}.price`)}
                  </p>
                  <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                    {[1, 2, 3].map((index) => (
                      <li key={index} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                        {t(`pricing.visibility.${visibility}.feature${index}`)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {["startingPrice", "platformFee", "tierStates"].map((item) => (
            <Card key={item} className="border-border/70 bg-card/60">
              <CardHeader className="space-y-2">
                <CardDescription>{t(`pricing.metric.${item}.label`)}</CardDescription>
                <CardTitle className="text-3xl">{t(`pricing.metric.${item}.value`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(`pricing.metric.${item}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-border/70 bg-card/60">
          <CardHeader>
            <CardTitle>{t("pricing.status.title")}</CardTitle>
            <CardDescription>{t("pricing.status.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/app/procedures">{t("pricing.action.procedures")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/posts">{t("pricing.action.posts")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/creator/library">{t("pricing.action.creatorLibrary")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Pricing;
