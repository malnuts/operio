import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileVideo, Microscope, RefreshCw, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildProcedureLibraryItems, getProcedureMeta, type ProcedureLibraryItem } from "@/lib/procedure-data";

const ProcedureLibrary = () => {
  const [items, setItems] = useState<ProcedureLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buildProcedureLibraryItems()
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch(() => {
        setError("Unable to load the procedure library right now.");
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
          Back to learner home
        </Link>

        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
            <Microscope className="h-3.5 w-3.5" />
            Procedure Library
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Browse procedure-based learning with structured playback.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              Each procedure exposes its format, duration, author context, and clinical difficulty
              before the learner opens the detail flow.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
            Loading procedures...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <section className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const meta = getProcedureMeta(item);

              return (
                <Link key={item.id} to={`/app/procedure/${item.id}`} className="group">
                  <Card className="h-full border-border/70 transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-4">
                      {item.thumbnailUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy"
                            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : null}

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">{item.title}</CardTitle>
                          <CardDescription className="text-sm leading-6">
                            {item.description}
                          </CardDescription>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          {item.type === "video" ? (
                            <FileVideo className="h-5 w-5" />
                          ) : (
                            <Stethoscope className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex flex-wrap gap-2">
                        {meta.map((label) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))}
                      </div>

                      {item.authorName ? (
                        <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{item.authorName}</p>
                          <p>{item.authorInstitution ?? "Independent clinical educator"}</p>
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
                        Open procedure
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

export default ProcedureLibrary;
