import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Microscope, ScrollText } from "lucide-react";

import AssessmentPromptCard from "@/components/AssessmentPromptCard";
import ModelViewer from "@/components/viewer/ModelViewer";
import { StepCarousel, StepList } from "@/components/StepNavigator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { resolveAssetUrl, resolveAssetUrlAsync } from "@/lib/asset-config";
import {
  buildProcedurePlayback,
  getProcedureMeta,
  loadProcedureById,
  loadQuestionsByProcedureId,
  normalizeQuestionSet,
  type NormalizedQuestion,
  type ProcedureLibraryItem,
  type ProcedurePlaybackUnit,
} from "@/lib/procedure-data";
import type { Procedure } from "@/types/content";

const ProcedureDetail = () => {
  const { id = "" } = useParams();
  const { progress, trackProcedureVisit, trackAssessmentAttempt } = useLearnerProgress();
  const alreadyCompleted = Boolean(progress.procedures[id]?.completed);
  const fallbackModelUrl = resolveAssetUrl("/models/shared/full-mouth.glb");

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [questions, setQuestions] = useState<Record<string, NormalizedQuestion>>({});
  const [playback, setPlayback] = useState<ProcedurePlaybackUnit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
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
        trackProcedureVisit(id, alreadyCompleted);

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

        setError("Unable to load this procedure right now.");
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

  const meta = useMemo(() => {
    if (!procedure) {
      return [];
    }

    return getProcedureMeta({
      id: procedure.id,
      type: procedure.type,
      title: typeof procedure.title === "string" ? procedure.title : procedure.id,
      description: typeof procedure.description === "string" ? procedure.description : "",
      difficulty: procedure.difficulty,
      duration: procedure.duration,
      thumbnailUrl: procedure.thumbnailUrl,
      authorName: procedure.author?.name,
      authorInstitution: procedure.author?.institution,
      tags: procedure.tags ?? [],
    } satisfies ProcedureLibraryItem);
  }, [procedure]);

  const completionPercent = playback.length ? Math.round(((currentIndex + Number(completed)) / playback.length) * 100) : 0;

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
          Loading procedure...
        </div>
      </main>
    );
  }

  if (error || !procedure || !currentUnit) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-5xl rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
          {error ?? "Procedure not found."}
        </div>
      </main>
    );
  }

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
                <CardTitle className="text-3xl">Procedure complete</CardTitle>
                <CardDescription className="text-base leading-7">
                  You finished {typeof procedure.title === "string" ? procedure.title : procedure.id} and
                  the session has been recorded in local learner progress.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Sections completed</p>
                  <p className="mt-2 text-3xl font-semibold">{playback.length}</p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Decision points answered</p>
                  <p className="mt-2 text-3xl font-semibold">{Object.keys(answeredQuestionIds).length}</p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Content format</p>
                  <p className="mt-2 text-3xl font-semibold">{procedure.type === "video" ? "Video" : "Sim"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/app/review">Go to review</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/app/procedures">Back to procedure library</Link>
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
              Back to procedure library
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">
                {typeof procedure.title === "string" ? procedure.title : procedure.id}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                {typeof procedure.description === "string" ? procedure.description : ""}
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
            <span className="text-muted-foreground">Playback progress</span>
            <span className="font-medium">
              {currentIndex + 1} / {playback.length}
            </span>
          </div>
          <Progress value={completionPercent} aria-label="Procedure playback progress" />
        </div>

        {/* Mobile: compact carousel above the content grid */}
        <div className="lg:hidden">
          <StepCarousel
            playback={playback}
            currentIndex={currentIndex}
            locked={currentQuestionLocked}
            onNext={goToNext}
            onPrevious={goToPrevious}
            onSelect={(index) => {
              setCurrentIndex(index);
              setSelectedOptionId(null);
            }}
          />
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr_1fr]">
          {/* Desktop: full step list in left column */}
          <div className="hidden lg:block">
            <StepList
              playback={playback}
              currentIndex={currentIndex}
              locked={currentQuestionLocked}
              onNext={goToNext}
              onPrevious={goToPrevious}
              onSelect={(index) => {
                setCurrentIndex(index);
                setSelectedOptionId(null);
              }}
            />
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                <Microscope className="h-3.5 w-3.5" />
                {currentUnit.title}
              </div>
              {procedure.videoUrl ? (
                <video
                  src={procedure.videoUrl}
                  poster={procedure.thumbnailUrl}
                  controls
                  className="w-full rounded-2xl bg-black"
                  style={{ maxHeight: 360 }}
                  aria-label={`Video: ${typeof procedure?.title === "string" ? procedure.title : ""}`}
                />
              ) : null}
              <div className="space-y-3">
                <CardTitle className="text-3xl">{currentUnit.supportingText ?? currentUnit.title}</CardTitle>
                <CardDescription className="text-base leading-7 text-muted-foreground">
                  {currentUnit.body}
                </CardDescription>
              </div>
              {currentUnit.cue ? (
                <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  {currentUnit.cue}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion ? (
                <AssessmentPromptCard
                  question={currentQuestion}
                  selectedOptionId={selectedOptionId}
                  answeredOptionId={currentAnswerId}
                  title="Decision point"
                  continueHint="Answer the decision point to continue."
                  onSelect={setSelectedOptionId}
                  onSubmit={submitAnswer}
                />
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={goToPrevious} disabled={currentIndex === 0}>
                  Previous
                </Button>
                <Button onClick={goToNext} disabled={currentQuestionLocked}>
                  {currentIndex === playback.length - 1 ? "Complete procedure" : "Next section"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {currentQuestionLocked ? (
                  <span className="text-sm text-muted-foreground">Answer the decision point to continue.</span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ScrollText className="h-5 w-5" />
                Reference panel
              </CardTitle>
              <CardDescription>
                Supporting anatomy, tools, and technique notes travel with the current section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resolvedModelUrl ? (
                <ModelViewer
                  modelPath={resolvedModelUrl}
                  fallbackModelPath={fallbackModelUrl}
                  label={typeof procedure?.title === "string" ? procedure.title : "Reference model"}
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
                  <p className="text-sm font-medium text-foreground">Anatomy</p>
                  <p className="text-sm leading-6 text-muted-foreground">{currentUnit.referenceContent.anatomy}</p>
                </div>
              ) : null}

              {currentUnit.referenceContent?.technique ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Technique notes</p>
                  <p className="text-sm leading-6 text-muted-foreground">{currentUnit.referenceContent.technique}</p>
                </div>
              ) : null}

              {!currentUnit.referenceContent ? (
                <p className="text-sm text-muted-foreground">
                  No supporting reference content is attached to this section yet.
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
