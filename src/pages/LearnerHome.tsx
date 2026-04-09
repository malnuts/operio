import { BookOpen, BrainCircuit, Microscope, ScanSearch, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePageContext } from "@/features/agent/usePageContext";
import { useI18n } from "@/hooks/useI18n";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";

const learnerEntryPoints = [
  {
    key: "procedures",
    href: "/app/procedures",
    icon: Stethoscope,
  },
  {
    key: "posts",
    href: "/app/posts",
    icon: BookOpen,
  },
  {
    key: "review",
    href: "/app/review",
    icon: BrainCircuit,
  },
  {
    key: "anatomy",
    href: "/app/anatomy/sample",
    icon: ScanSearch,
  },
];

const LearnerHome = () => {
  const { t } = useI18n();
  const { summary } = useLearnerProgress();
  const completionPercent = summary.trackedProcedures
    ? Math.round((summary.completedProcedures / summary.trackedProcedures) * 100)
    : 0;
  const recentAssessmentLabel = summary.recentAssessment?.questionId
    ? t("learnerHome.recentAssessment.value", { id: summary.recentAssessment.questionId })
    : t("learnerHome.recentAssessment.empty");

  usePageContext({ role: "learner", page: "home" }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="grid gap-6 rounded-3xl border border-border bg-card/60 p-8 shadow-sm lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              <Microscope className="h-3.5 w-3.5" />
              {t("learnerHome.badge")}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                {t("learnerHome.title")}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {t("learnerHome.description")}
              </p>
            </div>
          </div>

          <Card className="border-primary/15 bg-background/80">
            <CardHeader>
              <CardTitle className="text-xl">{t("learnerHome.progress.title")}</CardTitle>
              <CardDescription>
                {t("learnerHome.progress.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">{t("learnerHome.stats.completedProcedures")}</p>
                  <p className="mt-2 text-3xl font-semibold">{summary.completedProcedures}</p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">{t("learnerHome.stats.answeredAssessments")}</p>
                  <p className="mt-2 text-3xl font-semibold">{summary.assessmentCount}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("learnerHome.progress.label")}</span>
                  <span className="font-medium">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} aria-label={t("learnerHome.progress.aria")} />
              </div>

              <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                {recentAssessmentLabel}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{t("learnerHome.entryTitle")}</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              {t("learnerHome.entryDescription")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {learnerEntryPoints.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.href} to={item.href} className="group">
                  <Card className="h-full border-border/70 transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{t(`learnerHome.entry.${item.key}.title`)}</CardTitle>
                        <CardDescription className="text-sm leading-6">
                          {t(`learnerHome.entry.${item.key}.description`)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                        {t("learnerHome.openRoute")}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default LearnerHome;
