import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Microscope, ScrollText } from "lucide-react";

import AssessmentPromptCard from "@/components/AssessmentPromptCard";
import ModelViewer from "@/components/viewer/ModelViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/hooks/useI18n";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { usePageContext } from "@/features/agent/usePageContext";
import { resolveAssetUrl, resolveAssetUrlAsync } from "@/lib/asset-config";
import { resolveLocalizedText } from "@/lib/content-runtime";
import {
  buildProcedurePlayback,
  loadProcedureById,
  loadQuestionsByProcedureId,
  normalizeQuestionSet,
  type NormalizedQuestion,
  type ProcedurePlaybackUnit,
} from "@/lib/procedure-data";
import type { Procedure } from "@/types/content";

const ProcedureDetail = () => {
  const { t } = useI18n();
  const { id = "" } = useParams();
  const { progress, trackProcedureVisit, trackAssessmentAttempt } = useLearnerProgress();
  const fallbackModelUrl = resolveAssetUrl("/models/shared/full-mouth.glb");
  const alreadyCompletedRef = useRef(false);

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [questions, setQuestions] = useState<Record<string, NormalizedQuestion>>({});
  const [playback, setPlayback] = useState<ProcedurePlaybackUnit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string | null>(null);

  useEffect(() => {
    alreadyCompletedRef.current = Boolean(progress.procedures[id]?.completed);
  }, [id, progress.procedures]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setErrorKey(null);
    setProcedure(null);
    setQuestions({});
    setPlayback([]);
    setResolvedModelUrl(null);

    Promise.all([loadProcedureById(id), loadQuestionsByProcedureId(id)])
      .then(async ([nextProcedure, nextQuestions]) => {
        if (!active) {
          return;
        }

        setProcedure(nextProcedure);
        setPlayback(buildProcedurePlayback(nextProcedure));
        setQuestions(
          normalizeQuestionSet(nextQuestions).reduce<Record<string, NormalizedQuestion>>((accumulator, item) => {
            accumulator[item.id] = item;
            return accumulator;
          }, {}),
        );
        setCompleted(false);
        setCurrentIndex(0);
        setSelectedOptionId(null);
        setAnsweredQuestionIds({});
        trackProcedureVisit(id, alreadyCompletedRef.current);

        if (nextProcedure.modelPath) {
          resolveAssetUrlAsync(nextProcedure.modelPath)
            .then((url) => { if (active) setResolvedModelUrl(url); })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setErrorKey("procedureDetail.error");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, trackProcedureVisit]);

  const currentUnit = playback[currentIndex];
  const currentQuestion = currentUnit?.questionId ? questions[currentUnit.questionId] : undefined;
  const currentAnswerId = currentQuestion ? answeredQuestionIds[currentQuestion.id] : undefined;
  const currentQuestionLocked = Boolean(currentQuestion && !currentAnswerId);

  const completionPercent = playback.length ? Math.round(((currentIndex + Number(completed)) / playback.length) * 100) : 0;

  usePageContext({
    role: "learner",
    page: "procedure",
    contentId: id,
    contentType: "procedure",
    contentTitle: procedure ? resolveLocalizedText(procedure.title, "") : undefined,
    procedureType: procedure?.type,
    currentStep: currentUnit ? {
      id: currentUnit.id,
      narration: currentUnit.narration ?? "",
      actionDescription: currentUnit.actionDescription ? resolveLocalizedText(currentUnit.actionDescription, "") : undefined,
      index: currentIndex,
      total: playback.length,
    } : undefined,
    currentQuestion: currentQuestion ? {
      id: currentQuestion.id,
      stem: resolveLocalizedText(currentQuestion.stem, ""),
      answeredCorrectly: currentAnswerId ? currentQuestion.correctOptionId === currentAnswerId : undefined,
    } : undefined,
    referenceContent: currentUnit?.referenceContent ? {
      anatomy: currentUnit.referenceContent.anatomy ?? undefined,
      technique: currentUnit.referenceContent.technique ?? undefined,
      instrument: currentUnit.referenceContent.instrument?.name ?? undefined,
    } : undefined,
  }, [id, procedure, currentIndex, currentUnit, currentQuestion, currentAnswerId]);

  const formatDurationLabel = (value?: number) => {
    if (!value) {
      return undefined;
    }

    if (value < 60) {
      return t("procedure.meta.duration.minutes", { count: value });
    }

    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    if (!minutes) {
      return t("procedure.meta.duration.hoursOnly", { hours });
    }

    return t("procedure.meta.duration.hoursMinutes", { hours, minutes });
  };

  const getProcedureMetaLabels = (value: Procedure) =>
    [
      t(value.type === "video" ? "procedure.meta.video" : "procedure.meta.simulation"),
      value.difficulty,
      formatDurationLabel(value.duration),
    ].filter(Boolean) as string[];

  const getPlaybackTitle = (unit: ProcedurePlaybackUnit) =>
    unit.title
    || t(
      unit.titleFallback.kind === "chapter"
        ? "procedure.playback.chapter"
        : "procedure.playback.step",
      { index: unit.titleFallback.index },
    );

  const getPlaybackBody = (unit: ProcedurePlaybackUnit) =>
    unit.body
    || t(
      unit.bodyFallback === "video"
        ? "procedure.playback.videoBodyFallback"
        : "procedure.playback.simulationBodyFallback",
    );

  const getPlaybackCue = (unit: ProcedurePlaybackUnit) => {
    if (!unit.cue) {
      return undefined;
    }

    switch (unit.cue.kind) {
      case "videoTimestamp":
        return t("procedure.playback.cue.video", { seconds: unit.cue.seconds });
      case "instrument":
        return t("procedure.playback.cue.instrument", { instrumentId: unit.cue.instrumentId });
    }
  };

  const submitAnswer = () => {
    if (!currentQuestion || !selectedOptionId) {
      return;
    }

    setAnsweredQuestionIds((current) => ({
      ...current,
      [currentQuestion.id]: selectedOptionId,
    }));

    const selected = currentQuestion.options.find((option) => option.id === selectedOptionId);

    if (selected) {
      trackAssessmentAttempt({
        questionId: currentQuestion.id,
        contentId: id,
        contentType: "procedure",
        selectedOption: selected.label,
        isCorrect: selected.isCorrect,
      });
    }
  };

  const goToNext = () => {
    if (currentQuestionLocked) {
      return;
    }

    setSelectedOptionId(null);

    if (currentIndex === playback.length - 1) {
      setCompleted(true);
      trackProcedureVisit(id, true);
      return;
    }

    setCurrentIndex((current) => current + 1);
  };

  const goToPrevious = () => {
    setSelectedOptionId(null);
    setCompleted(false);
    setCurrentIndex((current) => Math.max(0, current - 1));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
          {t("procedureDetail.loading")}
        </div>
      </main>
    );
  }

  if (errorKey || !procedure || !currentUnit) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-5xl rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
          {t(errorKey ?? "procedureDetail.notFound")}
        </div>
      </main>
    );
  }

  const procedureTitle = resolveLocalizedText(procedure.title, procedure.id);
  const procedureDescription = resolveLocalizedText(procedure.description, "");
  const meta = getProcedureMetaLabels(procedure);
  const playbackTitle = getPlaybackTitle(currentUnit);
  const playbackBody = getPlaybackBody(currentUnit);
  const playbackCue = getPlaybackCue(currentUnit);

  if (completed) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Card className="border-primary/20 bg-card/70">
            <CardHeader className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">{t("procedureDetail.complete.title")}</CardTitle>
                  <CardDescription className="text-base leading-7">
                  {t("procedureDetail.complete.description", { title: procedureTitle })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">{t("procedureDetail.complete.stats.sections")}</p>
                  <p className="mt-2 text-3xl font-semibold">{playback.length}</p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">{t("procedureDetail.complete.stats.decisionPoints")}</p>
                  <p className="mt-2 text-3xl font-semibold">{Object.keys(answeredQuestionIds).length}</p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">{t("procedureDetail.complete.stats.contentFormat")}</p>
                  <p className="mt-2 text-3xl font-semibold">
                    {t(procedure.type === "video" ? "procedureDetail.format.video" : "procedureDetail.format.simulation")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/app/review">{t("procedureDetail.complete.action.review")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/app/procedures">{t("procedureDetail.complete.action.back")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Link to="/app/procedures" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t("procedureDetail.back")}
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">
                {procedureTitle}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                {procedureDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {meta.map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("procedureDetail.progress.label")}</span>
            <span className="font-medium">
              {currentIndex + 1} / {playback.length}
            </span>
          </div>
          <Progress value={completionPercent} aria-label={t("procedureDetail.progress.aria")} />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">

          <Card>
            <CardHeader className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                <Microscope className="h-3.5 w-3.5" />
                {playbackTitle}
              </div>
              {procedure.videoUrl ? (
                <video
                  src={procedure.videoUrl}
                  poster={procedure.thumbnailUrl}
                  controls
                  className="w-full rounded-2xl bg-black"
                  style={{ maxHeight: 360 }}
                  aria-label={t("procedureDetail.videoAria", {
                    title: procedureTitle,
                  })}
                />
              ) : null}
              <div className="space-y-3">
                <CardTitle className="text-3xl">{currentUnit.supportingText || playbackTitle}</CardTitle>
                <CardDescription className="text-base leading-7 text-muted-foreground">
                  {playbackBody}
                </CardDescription>
              </div>
              {playbackCue ? (
                <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  {playbackCue}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion ? (
                <AssessmentPromptCard
                  question={currentQuestion}
                  selectedOptionId={selectedOptionId}
                  answeredOptionId={currentAnswerId}
                  title={t("procedureDetail.assessment.title")}
                  continueHint={t("procedureDetail.assessment.continueHint")}
                  onSelect={setSelectedOptionId}
                  onSubmit={submitAnswer}
                />
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={goToPrevious} disabled={currentIndex === 0}>
                  {t("procedureDetail.action.previous")}
                </Button>
                <Button onClick={goToNext} disabled={currentQuestionLocked}>
                  {currentIndex === playback.length - 1
                    ? t("procedureDetail.action.complete")
                    : t("procedureDetail.action.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {currentQuestionLocked ? (
                  <span className="text-sm text-muted-foreground">{t("procedureDetail.assessment.continueHint")}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ScrollText className="h-5 w-5" />
                {t("procedureDetail.reference.title")}
              </CardTitle>
              <CardDescription>
                {t("procedureDetail.reference.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resolvedModelUrl ? (
                <ModelViewer
                  modelPath={resolvedModelUrl}
                  fallbackModelPath={fallbackModelUrl}
                  label={procedureTitle || t("procedureDetail.reference.modelLabel")}
                />
              ) : null}

              {currentUnit.referenceContent?.instrument ? (
                <div className="space-y-2 rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm font-medium text-foreground">{currentUnit.referenceContent.instrument.name}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {currentUnit.referenceContent.instrument.description}
                  </p>
                </div>
              ) : null}

              {currentUnit.referenceContent?.anatomy ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t("procedureDetail.reference.anatomy")}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{currentUnit.referenceContent.anatomy}</p>
                </div>
              ) : null}

              {currentUnit.referenceContent?.technique ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t("procedureDetail.reference.technique")}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{currentUnit.referenceContent.technique}</p>
                </div>
              ) : null}

              {!currentUnit.referenceContent ? (
                <p className="text-sm text-muted-foreground">
                  {t("procedureDetail.reference.empty")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default ProcedureDetail;
