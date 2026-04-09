import { useState } from "react";
import { Link } from "react-router-dom";

import CreatorShell from "@/components/CreatorShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreatorEntry } from "@/features/creator/schema";
import { useCreatorLibrary } from "@/features/creator/useCreatorLibrary";
import { useI18n } from "@/hooks/useI18n";

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const describeEntry = (entry: CreatorEntry) =>
  entry.kind === "procedure"
    ? entry.summary
    : entry.body;

const CreatorLibraryPage = () => {
  const { t } = useI18n();
  const { entries, drafts, published } = useCreatorLibrary();
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published">("all");

  const visibleEntries = activeTab === "all"
    ? entries
    : activeTab === "draft"
      ? drafts
      : published;

  return (
    <CreatorShell
      badge={t("creator.library.badge")}
      title={t("creator.library.title")}
      description={t("creator.library.description")}
      actions={(
        <Button asChild>
          <Link to="/creator/new?kind=procedure">{t("creator.library.newContent")}</Link>
        </Button>
      )}
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">{t("creator.library.filter.all")}</TabsTrigger>
          <TabsTrigger value="draft">{t("creator.library.filter.draft")}</TabsTrigger>
          <TabsTrigger value="published">{t("creator.library.filter.published")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {visibleEntries.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {visibleEntries.map((entry) => {
            const detail = describeEntry(entry);

            return (
              <Card key={entry.id} className="h-full">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{t(`creator.kind.${entry.kind}`)}</Badge>
                    <Badge variant="outline">{t(`creator.status.${entry.status}`)}</Badge>
                    <Badge variant="outline">{t(`creator.visibility.${entry.visibility}`)}</Badge>
                  </div>
                  <div className="space-y-2">
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription className="text-sm leading-6 text-muted-foreground">
                      {detail}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    {t("creator.library.updated", { date: formatTimestamp(entry.updatedAt) })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entry.kind === "procedure" ? (
                      <>
                        <Badge variant="secondary">{t("creator.library.meta.chapters", { count: String(entry.chapters.length) })}</Badge>
                        <Badge variant="secondary">{t("creator.library.meta.media", { count: String(entry.media.length) })}</Badge>
                        <Badge variant="secondary">{t("creator.library.meta.decisionPoints", { count: String(entry.decisionPoints.length) })}</Badge>
                        <Badge variant="secondary">{t("creator.library.meta.references", { count: String(entry.references.length) })}</Badge>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">{t("creator.library.meta.photos", { count: String(entry.photos.length) })}</Badge>
                        <Badge variant="secondary">{t("creator.library.meta.tags", { count: String(entry.tags.length) })}</Badge>
                        {entry.linkedAssessmentId ? (
                          <Badge variant="secondary">{t("creator.library.meta.linkedAssessment")}</Badge>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                      <Link to={`/creator/new?id=${entry.id}`}>{t("creator.library.edit")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t(`creator.library.empty.${activeTab}.title`)}</CardTitle>
            <CardDescription>{t(`creator.library.empty.${activeTab}.description`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/creator/new?kind=procedure">{t("creator.library.newContent")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </CreatorShell>
  );
};

export default CreatorLibraryPage;
