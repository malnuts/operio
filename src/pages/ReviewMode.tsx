import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, RotateCcw, Trophy } from "lucide-react";

import AssessmentPromptCard from "@/components/AssessmentPromptCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const { progress, trackAssessmentAttempt } = useLearnerProgress();
  const [questionMap, setQuestionMap] = useState<Record<string, ReviewQuestion>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

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

        setError("Unable to load review questions right now.");
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
                  <CardTitle className="text-3xl">Review session complete</CardTitle>
                  <CardDescription className="text-base leading-7">
                    Your standalone assessment run has been added to local learner progress.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">Questions answered</p>
                    <p className="mt-2 text-3xl font-semibold">{activeSet.questions.length}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">Correct answers</p>
                    <p className="mt-2 text-3xl font-semibold">{correctAnswers}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {activeSet.questions.length ? Math.round((correctAnswers / activeSet.questions.length) * 100) : 0}%
                    </p>
                  </div>
                </div>

                <Button variant="outline" onClick={resetActiveSet}>
                  Back to review
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
              Back to review
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">{activeSet.title}</h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">{activeSet.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Assessment progress</span>
              <span className="font-medium">
                {currentIndex + 1} / {activeSet.questions.length}
              </span>
            </div>
            <Progress value={reviewProgress} aria-label="Standalone review assessment progress" />
          </div>

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Standalone review</Badge>
                <Badge variant="outline">{currentQuestion.contentId}</Badge>
              </div>
              <CardDescription>
                Review mode reuses the same question engine as procedure playback, but without reopening the full procedure flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <AssessmentPromptCard
                question={currentQuestion}
                selectedOptionId={selectedOptionId}
                answeredOptionId={answeredOptionId}
                title="Review question"
                continueHint="Answer this prompt to continue through the standalone review set."
                onSelect={setSelectedOptionId}
                onSubmit={submitActiveAnswer}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={goToNextQuestion} disabled={!answeredOptionId}>
                  {currentIndex === activeSet.questions.length - 1 ? "Finish assessment" : "Next question"}
                </Button>
                {!answeredOptionId ? (
                  <span className="text-sm text-muted-foreground">Answer the current question to continue.</span>
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
            Back to learner home
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">Review</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Revisit answered questions, repeat missed prompts, and run standalone assessments outside the full procedure experience.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Answered prompts</CardDescription>
              <CardTitle className="text-3xl">{latestAttempts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Needs repetition</CardDescription>
              <CardTitle className="text-3xl">{incorrectQuestions.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Latest accuracy</CardDescription>
              <CardTitle className="text-3xl">{accuracy}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <RotateCcw className="h-5 w-5" />
                Standalone review assessments
              </CardTitle>
              <CardDescription>
                Launch a focused review set without reopening a full procedure walkthrough.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">Retry missed questions</p>
                    <p className="text-sm text-muted-foreground">
                      Repeat the latest prompts you missed and review the teaching explanation again.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      startSet({
                        title: "Retry missed questions",
                        description: "Focus on the prompts that still need repetition from your latest learner history.",
                        questions: incorrectQuestions,
                      })
                    }
                    disabled={!incorrectQuestions.length || loading || Boolean(error)}
                  >
                    Start set
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">Review all answered questions</p>
                    <p className="text-sm text-muted-foreground">
                      Run a broader standalone assessment across the questions you have already seen.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      startSet({
                        title: "Review all answered questions",
                        description: "Use a broader review set to rehearse answered prompts across procedure-linked assessments.",
                        questions: allAnsweredQuestions,
                      })
                    }
                    disabled={!allAnsweredQuestions.length || loading || Boolean(error)}
                  >
                    Start set
                  </Button>
                </div>
              </div>

              {loading ? <p className="text-sm text-muted-foreground">Loading review history...</p> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookOpenCheck className="h-5 w-5" />
                Recent prompts
              </CardTitle>
              <CardDescription>
                The latest attempt for each question becomes the signal that drives review mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestAttempts.length ? (
                latestAttempts.map((attempt) => (
                  <div key={`${attempt.contentId}:${attempt.questionId}`} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={attempt.isCorrect ? "secondary" : "destructive"}>
                        {attempt.isCorrect ? "Correct" : "Needs review"}
                      </Badge>
                      <Badge variant="outline">{attempt.contentId}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Question ID: {attempt.questionId}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Selected option: {attempt.selectedOption}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  Answer procedure-linked questions first. They will appear here as soon as learner progress exists.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5" />
              Shared assessment layer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Procedure-linked prompts and standalone review sets now use the same answer and explanation behavior, keeping the assessment experience consistent across the learner flow.
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ReviewMode;
