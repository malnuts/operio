import { useEffect, useState } from "react";
import type { ZodError } from "zod";

import AccessStatePanel from "@/components/AccessStatePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/useI18n";
import { contentVisibilityOrder } from "@/lib/content-access";
import {
  creatorPostInputSchema,
  creatorProcedureInputSchema,
  type CreatorContentInput,
  type CreatorContentKind,
  type CreatorEntry,
  type CreatorPostInput,
  type CreatorProcedureInput,
  type CreatorPublicationStatus,
} from "@/features/creator/schema";

type CreatorContentFormProps = {
  kind: CreatorContentKind;
  isEditing: boolean;
  entry: CreatorEntry | null;
  onKindChange: (kind: CreatorContentKind) => void;
  onSubmit: (input: CreatorContentInput, status: CreatorPublicationStatus) => void;
};

type ProcedureDraftFormState = {
  title: string;
  summary: string;
  visibility: CreatorProcedureInput["visibility"];
  chapters: string;
  media: string;
  decisionPoints: string;
  references: string;
};

type PostDraftFormState = {
  title: string;
  body: string;
  visibility: CreatorPostInput["visibility"];
  photos: string;
  tags: string;
  linkedAssessmentId: string;
};

const createProcedureFormState = (entry?: CreatorEntry | null): ProcedureDraftFormState =>
  entry?.kind === "procedure"
    ? {
        title: entry.title,
        summary: entry.summary,
        visibility: entry.visibility,
        chapters: entry.chapters.join("\n"),
        media: entry.media.join("\n"),
        decisionPoints: entry.decisionPoints.join("\n"),
        references: entry.references.join("\n"),
      }
    : {
        title: "",
        summary: "",
        visibility: "free",
        chapters: "",
        media: "",
        decisionPoints: "",
        references: "",
      };

const createPostFormState = (entry?: CreatorEntry | null): PostDraftFormState =>
  entry?.kind === "post"
    ? {
        title: entry.title,
        body: entry.body,
        visibility: entry.visibility,
        photos: entry.photos.join("\n"),
        tags: entry.tags.join(", "),
        linkedAssessmentId: entry.linkedAssessmentId ?? "",
      }
    : {
        title: "",
        body: "",
        visibility: "free",
        photos: "",
        tags: "",
        linkedAssessmentId: "",
      };

const splitMultiline = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const splitTags = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const PROCEDURE_ERROR_KEYS: Record<string, string> = {
  title: "creator.validation.procedure.title",
  summary: "creator.validation.procedure.summary",
  visibility: "creator.validation.common.visibility",
  chapters: "creator.validation.procedure.chapters",
  media: "creator.validation.procedure.media",
  decisionPoints: "creator.validation.procedure.decisionPoints",
  references: "creator.validation.procedure.references",
};

const POST_ERROR_KEYS: Record<string, string> = {
  title: "creator.validation.post.title",
  body: "creator.validation.post.body",
  visibility: "creator.validation.common.visibility",
  photos: "creator.validation.post.photos",
  tags: "creator.validation.post.tags",
};

const toFieldErrors = (
  error: ZodError,
  fieldMap: Record<string, string>,
) =>
  error.issues.reduce<Record<string, string>>((accumulator, issue) => {
    const field = String(issue.path[0] ?? "");
    if (field && fieldMap[field] && !accumulator[field]) {
      accumulator[field] = fieldMap[field];
    }
    return accumulator;
  }, {});

const CreatorContentForm = ({
  kind,
  isEditing,
  entry,
  onKindChange,
  onSubmit,
}: CreatorContentFormProps) => {
  const { t } = useI18n();
  const [procedureForm, setProcedureForm] = useState<ProcedureDraftFormState>(() => createProcedureFormState(entry));
  const [postForm, setPostForm] = useState<PostDraftFormState>(() => createPostFormState(entry));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setProcedureForm(createProcedureFormState(entry));
    setPostForm(createPostFormState(entry));
    setErrors({});
  }, [entry]);

  const submitProcedure = (status: CreatorPublicationStatus) => {
    const parsed = creatorProcedureInputSchema.safeParse({
      kind: "procedure",
      title: procedureForm.title.trim(),
      summary: procedureForm.summary.trim(),
      visibility: procedureForm.visibility,
      chapters: splitMultiline(procedureForm.chapters),
      media: splitMultiline(procedureForm.media),
      decisionPoints: splitMultiline(procedureForm.decisionPoints),
      references: splitMultiline(procedureForm.references),
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error, PROCEDURE_ERROR_KEYS));
      return;
    }

    setErrors({});
    onSubmit(parsed.data, status);
  };

  const submitPost = (status: CreatorPublicationStatus) => {
    const parsed = creatorPostInputSchema.safeParse({
      kind: "post",
      title: postForm.title.trim(),
      body: postForm.body.trim(),
      visibility: postForm.visibility,
      photos: splitMultiline(postForm.photos),
      tags: splitTags(postForm.tags),
      linkedAssessmentId: postForm.linkedAssessmentId.trim() || undefined,
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error, POST_ERROR_KEYS));
      return;
    }

    setErrors({});
    onSubmit(parsed.data, status);
  };

  return (
    <div className="space-y-6">
      {!isEditing ? (
        <Tabs value={kind} onValueChange={(value) => onKindChange(value as CreatorContentKind)} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="procedure">{t("creator.kind.procedure")}</TabsTrigger>
            <TabsTrigger value="post">{t("creator.kind.post")}</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t(`creator.kind.${kind}`)}</Badge>
          <Badge variant="outline">{t(`creator.status.${entry?.status ?? "draft"}`)}</Badge>
        </div>
      )}

      {Object.keys(errors).length ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t("creator.validation.summary")}
        </div>
      ) : null}

      {kind === "procedure" ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("creator.editor.procedure.title")}</CardTitle>
              <CardDescription>{t("creator.editor.procedure.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="procedure-title">{t("creator.field.title")}</Label>
                <Input
                  id="procedure-title"
                  value={procedureForm.title}
                  onChange={(event) => setProcedureForm((current) => ({ ...current, title: event.target.value }))}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title ? <p className="text-sm text-destructive">{t(errors.title)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure-summary">{t("creator.field.summary")}</Label>
                <Textarea
                  id="procedure-summary"
                  value={procedureForm.summary}
                  onChange={(event) => setProcedureForm((current) => ({ ...current, summary: event.target.value }))}
                  aria-invalid={Boolean(errors.summary)}
                />
                {errors.summary ? <p className="text-sm text-destructive">{t(errors.summary)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure-chapters">{t("creator.field.chapters")}</Label>
                <Textarea
                  id="procedure-chapters"
                  value={procedureForm.chapters}
                  onChange={(event) => setProcedureForm((current) => ({ ...current, chapters: event.target.value }))}
                  aria-invalid={Boolean(errors.chapters)}
                />
                {errors.chapters ? <p className="text-sm text-destructive">{t(errors.chapters)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure-media">{t("creator.field.media")}</Label>
                <Textarea
                  id="procedure-media"
                  value={procedureForm.media}
                  onChange={(event) => setProcedureForm((current) => ({ ...current, media: event.target.value }))}
                  aria-invalid={Boolean(errors.media)}
                />
                {errors.media ? <p className="text-sm text-destructive">{t(errors.media)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure-decision-points">{t("creator.field.decisionPoints")}</Label>
                <Textarea
                  id="procedure-decision-points"
                  value={procedureForm.decisionPoints}
                  onChange={(event) => setProcedureForm((current) => ({ ...current, decisionPoints: event.target.value }))}
                  aria-invalid={Boolean(errors.decisionPoints)}
                />
                {errors.decisionPoints ? <p className="text-sm text-destructive">{t(errors.decisionPoints)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure-references">{t("creator.field.references")}</Label>
                <Textarea
                  id="procedure-references"
                  value={procedureForm.references}
                  onChange={(event) => setProcedureForm((current) => ({ ...current, references: event.target.value }))}
                  aria-invalid={Boolean(errors.references)}
                />
                {errors.references ? <p className="text-sm text-destructive">{t(errors.references)}</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{t("creator.editor.access.title")}</CardTitle>
              <CardDescription>{t("creator.editor.access.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="procedure-visibility">{t("creator.field.visibility")}</Label>
                <select
                  id="procedure-visibility"
                  value={procedureForm.visibility}
                  onChange={(event) =>
                    setProcedureForm((current) => ({
                      ...current,
                      visibility: event.target.value as ProcedureDraftFormState["visibility"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  aria-invalid={Boolean(errors.visibility)}
                >
                  {contentVisibilityOrder.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {t(`creator.visibility.${visibility}`)}
                    </option>
                  ))}
                </select>
                {errors.visibility ? <p className="text-sm text-destructive">{t(errors.visibility)}</p> : null}
              </div>

              <AccessStatePanel
                visibility={procedureForm.visibility}
                variant="detail"
                showPricingLink
              />

              <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("creator.editor.procedure.checklistTitle")}</p>
                <ul className="mt-2 space-y-2">
                  {["chapters", "media", "decisionPoints", "references"].map((item) => (
                    <li key={item}>{t(`creator.editor.procedure.checklist.${item}`)}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => submitProcedure("draft")}>
                  {t(isEditing ? "creator.action.updateDraft" : "creator.action.saveDraft")}
                </Button>
                <Button type="button" onClick={() => submitProcedure("published")}>
                  {t(isEditing ? "creator.action.updatePublished" : "creator.action.publish")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("creator.editor.post.title")}</CardTitle>
              <CardDescription>{t("creator.editor.post.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="post-title">{t("creator.field.title")}</Label>
                <Input
                  id="post-title"
                  value={postForm.title}
                  onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title ? <p className="text-sm text-destructive">{t(errors.title)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-body">{t("creator.field.body")}</Label>
                <Textarea
                  id="post-body"
                  value={postForm.body}
                  onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))}
                  className="min-h-[220px]"
                  aria-invalid={Boolean(errors.body)}
                />
                {errors.body ? <p className="text-sm text-destructive">{t(errors.body)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-photos">{t("creator.field.photos")}</Label>
                <Textarea
                  id="post-photos"
                  value={postForm.photos}
                  onChange={(event) => setPostForm((current) => ({ ...current, photos: event.target.value }))}
                  aria-invalid={Boolean(errors.photos)}
                />
                {errors.photos ? <p className="text-sm text-destructive">{t(errors.photos)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-tags">{t("creator.field.tags")}</Label>
                <Input
                  id="post-tags"
                  value={postForm.tags}
                  onChange={(event) => setPostForm((current) => ({ ...current, tags: event.target.value }))}
                  aria-invalid={Boolean(errors.tags)}
                />
                {errors.tags ? <p className="text-sm text-destructive">{t(errors.tags)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-assessment">{t("creator.field.linkedAssessmentId")}</Label>
                <Input
                  id="post-assessment"
                  value={postForm.linkedAssessmentId}
                  onChange={(event) => setPostForm((current) => ({ ...current, linkedAssessmentId: event.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{t("creator.editor.access.title")}</CardTitle>
              <CardDescription>{t("creator.editor.access.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="post-visibility">{t("creator.field.visibility")}</Label>
                <select
                  id="post-visibility"
                  value={postForm.visibility}
                  onChange={(event) =>
                    setPostForm((current) => ({
                      ...current,
                      visibility: event.target.value as PostDraftFormState["visibility"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  aria-invalid={Boolean(errors.visibility)}
                >
                  {contentVisibilityOrder.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {t(`creator.visibility.${visibility}`)}
                    </option>
                  ))}
                </select>
                {errors.visibility ? <p className="text-sm text-destructive">{t(errors.visibility)}</p> : null}
              </div>

              <AccessStatePanel
                visibility={postForm.visibility}
                variant="detail"
                showPricingLink
              />

              <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("creator.editor.post.checklistTitle")}</p>
                <ul className="mt-2 space-y-2">
                  {["body", "photos", "tags", "linkedAssessment"].map((item) => (
                    <li key={item}>{t(`creator.editor.post.checklist.${item}`)}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => submitPost("draft")}>
                  {t(isEditing ? "creator.action.updateDraft" : "creator.action.saveDraft")}
                </Button>
                <Button type="button" onClick={() => submitPost("published")}>
                  {t(isEditing ? "creator.action.updatePublished" : "creator.action.publish")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreatorContentForm;
