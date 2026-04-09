import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, RotateCcw, Trophy } from "lucide-react";

import AssessmentPromptCard from "@/components/AssessmentPromptCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePageContext } from "@/features/agent/usePageContext";
import { useI18n } from "@/hooks/useI18n";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { loadQuestionsByProcedureId, normalizeQuestionSet, type NormalizedQuestion } from "@/lib/procedure-data";

type ReviewQuestion = NormalizedQuestion & {
  contentId: string;
};

type ReviewSet = {
  title: string;
  description: string;
  questions: ReviewQuestion[];
};

const ReviewMode = () => {
  const { t } = useI18n();
  const { progress, trackAssessmentAttempt } = useLearnerProgress();
  const [questionMap, setQuestionMap] = useState<Record<string, ReviewQuestion>>({});
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [activeSet, setActiveSet] = useState<ReviewSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredOptionIds, setAnsweredOptionIds] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    const contentIds = Array.from(
      new Set(
        progress.assessmentHistory
          .filter((entry) => entry.contentType === "procedure" || entry.contentType === "assessment")
          .map((entry) => entry.contentId),
      ),
    );

    if (!contentIds.length) {
      setQuestionMap({});
      setLoading(false);
      setErrorKey(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setErrorKey(null);

    Promise.all(
      contentIds.map(async (contentId) => {
        const payload = await loadQuestionsByProcedureId(contentId);
        return normalizeQuestionSet(payload).map((question) => ({
          ...question,
          contentId,
        }));
      }),
    )
      .then((groups) => {
        if (!active) {
          return;
        }

        setQuestionMap(
          groups.flat().reduce<Record<string, ReviewQuestion>>((accumulator, question) => {
            accumulator[`${question.contentId}:${question.id}`] = question;
            return accumulator;
          }, {}),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setErrorKey("review.error");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [progress.assessmentHistory]);

  usePageContext({
    role: "learner",
    page: "review",
    contentType: "assessment",
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setAnsweredOptionIds({});
    setCompleted(false);
  }, [activeSet]);

  const latestAttempts = useMemo(() => {
    const seen = new Set<string>();

    return progress.assessmentHistory.filter((attempt) => {
      const key = `${attempt.contentId}:${attempt.questionId}`;

      if (!attempt.questionId || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [progress.assessmentHistory]);

  const allAnsweredQuestions = useMemo(
    () =>
      latestAttempts
        .map((attempt) => questionMap[`${attempt.contentId}:${attempt.questionId}`])
        .filter(Boolean),
    [latestAttempts, questionMap],
  );

  const incorrectQuestions = useMemo(
    () =>
      latestAttempts
        .filter((attempt) => !attempt.isCorrect)
        .map((attempt) => questionMap[`${attempt.contentId}:${attempt.questionId}`])
        .filter(Boolean),
    [latestAttempts, questionMap],
  );

  const accuracy = latestAttempts.length
    ? Math.round((latestAttempts.filter((attempt) => attempt.isCorrect).length / latestAttempts.length) * 100)
    : 0;

  const currentQuestion = activeSet?.questions[currentIndex];
  const answeredOptionId = currentQuestion ? answeredOptionIds[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(answeredOptionIds).length;
  const reviewProgress = activeSet?.questions.length
    ? Math.round((answeredCount / activeSet.questions.length) * 100)
    : 0;

  const startSet = (set: ReviewSet) => {
    setActiveSet(set);
  };

  const submitActiveAnswer = () => {
    if (!currentQuestion || !selectedOptionId) {
      return;
    }

    const selectedOption = currentQuestion.options.find((option) => option.id === selectedOptionId);

    if (!selectedOption) {
      return;
    }

    setAnsweredOptionIds((current) => ({
      ...current,
      [currentQuestion.id]: selectedOption.id,
    }));

    trackAssessmentAttempt({
      questionId: currentQuestion.id,
      contentId: currentQuestion.contentId,
      contentType: "assessment",
      selectedOption: selectedOption.label,
      isCorrect: selectedOption.isCorrect,
    });
  };

  const goToNextQuestion = () => {
    if (!activeSet || !currentQuestion || !answeredOptionId) {
      return;
    }

    setSelectedOptionId(null);

    if (currentIndex === activeSet.questions.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex((current) => current + 1);
  };

  const resetActiveSet = () => {
    setActiveSet(null);
  };

  if (activeSet && currentQuestion) {
    const correctAnswers = activeSet.questions.filter((question) => {
      const optionId = answeredOptionIds[question.id];
      return question.options.find((option) => option.id === optionId)?.isCorrect;
    }).length;

    if (completed) {
      return (
        <main className="min-h-screen bg-background px-6 py-16 text-foreground">
          <div className="mx-auto max-w-4xl">
            <Card className="border-primary/20 bg-card/70">
              <CardHeader className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-3xl">{t("review.complete.title")}</CardTitle>
                  <CardDescription className="text-base leading-7">
                    {t("review.complete.description")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">{t("review.complete.stats.answered")}</p>
                    <p className="mt-2 text-3xl font-semibold">{activeSet.questions.length}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">{t("review.complete.stats.correct")}</p>
                    <p className="mt-2 text-3xl font-semibold">{correctAnswers}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">{t("review.complete.stats.accuracy")}</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {activeSet.questions.length ? Math.round((correctAnswers / activeSet.questions.length) * 100) : 0}%
                    </p>
                  </div>
                </div>

                <Button variant="outline" onClick={resetActiveSet}>
                  {t("review.back")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="space-y-3">
            <Button variant="outline" className="w-fit" onClick={resetActiveSet}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("review.back")}
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">{activeSet.title}</h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">{activeSet.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("review.progress.label")}</span>
              <span className="font-medium">
                {currentIndex + 1} / {activeSet.questions.length}
              </span>
            </div>
            <Progress value={reviewProgress} aria-label={t("review.progress.aria")} />
          </div>

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("review.standalone.badge")}</Badge>
                <Badge variant="outline">{currentQuestion.contentId}</Badge>
              </div>
              <CardDescription>
                {t("review.standalone.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <AssessmentPromptCard
                question={currentQuestion}
                selectedOptionId={selectedOptionId}
                answeredOptionId={answeredOptionId}
                title={t("review.standalone.assessmentTitle")}
                continueHint={t("review.standalone.continueHint")}
                onSelect={setSelectedOptionId}
                onSubmit={submitActiveAnswer}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={goToNextQuestion} disabled={!answeredOptionId}>
                  {currentIndex === activeSet.questions.length - 1
                    ? t("review.standalone.finish")
                    : t("review.standalone.next")}
                </Button>
                {!answeredOptionId ? (
                  <span className="text-sm text-muted-foreground">{t("review.standalone.continueHint")}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="space-y-3">
          <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("review.homeBack")}
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">{t("review.title")}</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {t("review.description")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t("review.metrics.answered")}</CardDescription>
              <CardTitle className="text-3xl">{latestAttempts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t("review.metrics.repetition")}</CardDescription>
              <CardTitle className="text-3xl">{incorrectQuestions.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t("review.metrics.accuracy")}</CardDescription>
              <CardTitle className="text-3xl">{accuracy}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <RotateCcw className="h-5 w-5" />
                {t("review.sets.title")}
              </CardTitle>
              <CardDescription>
                {t("review.sets.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{t("review.set.retry.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("review.set.retry.description")}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      startSet({
                        title: t("review.set.retry.title"),
                        description: t("review.set.retry.sessionDescription"),
                        questions: incorrectQuestions,
                      })
                    }
                    disabled={!incorrectQuestions.length || loading || Boolean(errorKey)}
                  >
                    {t("review.set.start")}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{t("review.set.all.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("review.set.all.description")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      startSet({
                        title: t("review.set.all.title"),
                        description: t("review.set.all.sessionDescription"),
                        questions: allAnsweredQuestions,
                      })
                    }
                    disabled={!allAnsweredQuestions.length || loading || Boolean(errorKey)}
                  >
                    {t("review.set.start")}
                  </Button>
                </div>
              </div>

              {loading ? <p className="text-sm text-muted-foreground">{t("review.loading")}</p> : null}
              {errorKey ? <p className="text-sm text-destructive">{t(errorKey)}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookOpenCheck className="h-5 w-5" />
                {t("review.recent.title")}
              </CardTitle>
              <CardDescription>
                {t("review.recent.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestAttempts.length ? (
                latestAttempts.map((attempt) => (
                  <div key={`${attempt.contentId}:${attempt.questionId}`} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={attempt.isCorrect ? "secondary" : "destructive"}>
                        {attempt.isCorrect ? t("review.recent.correct") : t("review.recent.needsReview")}
                      </Badge>
                      <Badge variant="outline">{attempt.contentId}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("review.recent.questionId", { id: attempt.questionId ?? "" })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("review.recent.selectedOption", { option: attempt.selectedOption })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  {t("review.recent.empty")}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5" />
              {t("review.shared.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {t("review.shared.description")}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ReviewMode;
