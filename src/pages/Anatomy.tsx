import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ScanSearch } from "lucide-react";

import ModelViewer from "@/components/viewer/ModelViewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAssetUrl } from "@/lib/asset-config";

type VisualReference = {
  id: string;
  label: string;
  description: string;
  modelPath: string;
  field?: string;
  tags?: string[];
};

type VisualManifest = {
  references: VisualReference[];
};

const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

const Anatomy = () => {
  const { id = "" } = useParams();
  const [reference, setReference] = useState<VisualReference | null>(null);
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(withBase("/data/visual-manifest.json"))
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load visual manifest");
        return r.json() as Promise<VisualManifest>;
      })
      .then((manifest) => {
        const found = manifest.references.find((ref) => ref.id === id);
        if (!active) return;

        if (found) {
          if (active) {
            setReference(found);
            setResolvedModelUrl(resolveAssetUrl(found.modelPath));
          }
        } else {
          if (active) setError(`No visual reference found for "${id}".`);
        }
      })
      .catch(() => {
        if (active) setError("Unable to load the visual reference right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="space-y-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to learner home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
            <ScanSearch className="h-3.5 w-3.5" />
            Visual Reference
          </div>

          {reference ? (
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">{reference.label}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {reference.description}
              </p>
              {reference.field ? (
                <Badge variant="secondary">{reference.field}</Badge>
              ) : null}
            </div>
          ) : loading ? (
            <h1 className="text-4xl font-semibold tracking-tight text-muted-foreground">
              Loading reference…
            </h1>
          ) : (
            <h1 className="text-4xl font-semibold tracking-tight">
              Visual Reference
            </h1>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
            Loading visual reference…
          </div>
        ) : error ? (
          <div
            className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive"
            data-testid="anatomy-error"
          >
            {error}
          </div>
        ) : reference ? (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {resolvedModelUrl ? (
              <ModelViewer
                modelPath={resolvedModelUrl}
                label={reference.label}
                description={reference.description}
              />
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-border bg-muted/40 text-sm text-muted-foreground">
                Preparing model…
              </div>
            )}

            <Card className="h-fit border-border/70">
              <CardHeader>
                <CardTitle className="text-xl">{reference.label}</CardTitle>
                <CardDescription className="leading-6">
                  {reference.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reference.field ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Field</p>
                    <p className="text-sm text-muted-foreground">{reference.field}</p>
                  </div>
                ) : null}

                {reference.tags?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Key structures</p>
                    <div className="flex flex-wrap gap-2">
                      {reference.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Controls</p>
                  <ul className="mt-2 space-y-1">
                    <li>Drag to orbit</li>
                    <li>Scroll to zoom</li>
                    <li>Right-drag to pan</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
};

export default Anatomy;
