import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Calendar, FileText, RefreshCw } from "lucide-react";

import AccessStateBadge from "@/components/AccessStateBadge";
import AccessStatePanel from "@/components/AccessStatePanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";
import { buildPostLibraryItems, formatPublishDate, type PostLibraryItem } from "@/lib/post-data";

const PostLibrary = () => {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<PostLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    buildPostLibraryItems()
      .then((data) => {
        setItems(data);
        setErrorKey(null);
      })
      .catch(() => {
        setErrorKey("postLibrary.error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("postLibrary.back")}
        </Link>

        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            {t("postLibrary.badge")}
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {t("postLibrary.title")}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              {t("postLibrary.description")}
            </p>
            <Link to="/pricing" className="inline-flex text-sm font-medium text-primary hover:underline">
              {t("pricing.link.label")}
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
            {t("postLibrary.loading")}
          </div>
        ) : null}

        {errorKey ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
            {t(errorKey)}
          </div>
        ) : null}

        {!loading && !errorKey ? (
          <section className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const meta = [
                item.field,
                item.topic,
                item.hasLinkedAssessment ? t("post.meta.linkedAssessment") : undefined,
              ].filter(Boolean) as string[];

              return (
                <Link key={item.id} to={`/app/post/${item.id}`} className="group">
                  <Card className="h-full border-border/70 transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">{item.title}</CardTitle>
                          <CardDescription className="text-sm leading-6">
                            {item.excerpt}
                          </CardDescription>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          {item.hasLinkedAssessment ? (
                            <FileText className="h-5 w-5" />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex flex-wrap gap-2">
                        <AccessStateBadge visibility={item.visibility} />
                        {meta.map((label) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))}
                      </div>

                      <AccessStatePanel visibility={item.visibility} />

                      <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{item.authorName}</p>
                        <p>{item.authorInstitution ?? t("postLibrary.authorFallback")}</p>
                      </div>

                      {item.publishDate ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatPublishDate(item.publishDate, lang)}
                        </div>
                      ) : null}

                      {item.tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <RefreshCw className="h-4 w-4" />
                        {t("postLibrary.open")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default PostLibrary;
