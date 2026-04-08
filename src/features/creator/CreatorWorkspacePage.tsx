import { Link } from "react-router-dom";
import { Folders, FilePlus2, NotebookPen, Rows3, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreatorShell from "@/features/creator/CreatorShell";
import { useCreatorLibrary } from "@/features/creator/useCreatorLibrary";
import { useI18n } from "@/hooks/useI18n";

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const CreatorWorkspacePage = () => {
  const { t } = useI18n();
  const { summary } = useCreatorLibrary();

  return (
    <CreatorShell
      badge={t("creator.workspace.badge")}
      title={t("creator.workspace.title")}
      description={t("creator.workspace.description")}
      actions={(
        <>
          <Button asChild>
            <Link to="/creator/new?kind=procedure">{t("creator.workspace.newProcedure")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/creator/library">{t("creator.workspace.openLibrary")}</Link>
          </Button>
        </>
      )}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { key: "drafts", icon: Rows3, value: summary.drafts },
          { key: "published", icon: ShieldCheck, value: summary.published },
          { key: "procedures", icon: NotebookPen, value: summary.procedures },
          { key: "posts", icon: Folders, value: summary.posts },
        ].map((item) => (
          <Card key={item.key}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-2">
                <CardDescription>{t(`creator.workspace.stats.${item.key}`)}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("creator.workspace.launchpad.title")}</CardTitle>
            <CardDescription>{t("creator.workspace.launchpad.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link
              to="/creator/new?kind=procedure"
              className="rounded-2xl border border-border bg-muted/30 p-5 transition-colors hover:border-primary/40"
            >
              <p className="text-lg font-semibold">{t("creator.kind.procedure")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("creator.workspace.launchpad.procedure")}
              </p>
            </Link>
            <Link
              to="/creator/new?kind=post"
              className="rounded-2xl border border-border bg-muted/30 p-5 transition-colors hover:border-primary/40"
            >
              <p className="text-lg font-semibold">{t("creator.kind.post")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("creator.workspace.launchpad.post")}
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("creator.workspace.access.title")}</CardTitle>
            <CardDescription>{t("creator.workspace.access.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["free", "paid", "premium"].map((visibility) => (
              <div key={visibility} className="rounded-2xl bg-muted/50 p-4">
                <Badge variant="secondary">{t(`creator.visibility.${visibility}`)}</Badge>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`creator.workspace.access.${visibility}`)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t("creator.workspace.recent.title")}</CardTitle>
            <CardDescription>{t("creator.workspace.recent.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recentEntry ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t(`creator.kind.${summary.recentEntry.kind}`)}</Badge>
                  <Badge variant="outline">{t(`creator.status.${summary.recentEntry.status}`)}</Badge>
                  <Badge variant="outline">{t(`creator.visibility.${summary.recentEntry.visibility}`)}</Badge>
                </div>
                <p className="mt-4 text-xl font-semibold">{summary.recentEntry.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("creator.workspace.recent.updated", { date: formatTimestamp(summary.recentEntry.updatedAt) })}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                {t("creator.workspace.recent.empty")}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </CreatorShell>
  );
};

export default CreatorWorkspacePage;
