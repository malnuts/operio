import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Calendar, FileText, Tag } from "lucide-react";

import AssessmentPromptCard from "@/components/AssessmentPromptCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { usePageContext } from "@/features/agent/usePageContext";
import { resolveLocalizedText } from "@/lib/content-runtime";
import {
  formatPublishDate,
  loadPostById,
  loadQuestionsByAssessmentId,
  normalizePostQuestionSet,
} from "@/lib/post-data";
import type { NormalizedQuestion } from "@/lib/procedure-data";
import type { ClinicalPost } from "@/types/content";

const PostDetail = () => {
  const { t, lang } = useI18n();
  const { id = "" } = useParams();
  const { trackAssessmentAttempt } = useLearnerProgress();

  const [post, setPost] = useState<ClinicalPost | null>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setErrorKey(null);

    loadPostById(id)
      .then(async (nextPost) => {
        if (!active) return;
        setPost(nextPost);

        if (nextPost.linkedAssessmentId) {
          try {
            const questionSet = await loadQuestionsByAssessmentId(nextPost.linkedAssessmentId);
            if (active) setQuestions(normalizePostQuestionSet(questionSet));
          } catch {
            // Linked assessment is optional — don't fail the page
          }
        }
      })
      .catch(() => {
        if (active) setErrorKey("postDetail.error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswerId = currentQuestion ? answeredQuestionIds[currentQuestion.id] : undefined;

  usePageContext({
    role: "learner",
    page: "post",
    contentId: id,
    contentType: "post",
    contentTitle: post ? resolveLocalizedText(post.title, "") : undefined,
    currentQuestion: currentQuestion ? {
      id: currentQuestion.id,
      stem: resolveLocalizedText(currentQuestion.stem, ""),
      answeredCorrectly: currentAnswerId ? currentQuestion.correctOptionId === currentAnswerId : undefined,
    } : undefined,
  }, [id, post, currentQuestion, currentAnswerId]);

  const submitAnswer = () => {
    if (!currentQuestion || !selectedOptionId) return;

    setAnsweredQuestionIds((current) => ({
      ...current,
      [currentQuestion.id]: selectedOptionId,
    }));

    const selected = currentQuestion.options.find((option) => option.id === selectedOptionId);

    if (selected) {
      trackAssessmentAttempt({
        questionId: currentQuestion.id,
        contentId: id,
        contentType: "post",
        selectedOption: selected.label,
        isCorrect: selected.isCorrect,
      });
    }
  };

  const goToNextQuestion = () => {
    setSelectedOptionId(null);
    setCurrentQuestionIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
          {t("postDetail.loading")}
        </div>
      </main>
    );
  }

  if (errorKey || !post) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-3xl rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
          {t(errorKey ?? "postDetail.notFound")}
        </div>
      </main>
    );
  }

  const title = resolveLocalizedText(post.title, post.id);
  const body = resolveLocalizedText(post.body, "");
  const excerpt = post.excerpt ? resolveLocalizedText(post.excerpt, "") : undefined;
  const tags = post.tags ?? [];
  const meta = [post.field, post.topic].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-3">
          <Link
            to="/app/posts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("postDetail.back")}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            {t("postDetail.badge")}
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>

          {excerpt ? (
            <p className="text-base leading-7 text-muted-foreground">{excerpt}</p>
          ) : null}

          {meta.length ? (
            <div className="flex flex-wrap gap-2">
              {meta.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              {post.author.photoUrl ? (
                <img
                  src={post.author.photoUrl}
                  alt={post.author.name}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {post.author.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">{post.author.name}</CardTitle>
              <CardDescription className="text-sm">
                {[post.author.specialty, post.author.institution].filter(Boolean).join(" — ") ||
                  t("postDetail.authorFallback")}
              </CardDescription>
              {post.publishDate ? (
                <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatPublishDate(post.publishDate, lang)}
                </div>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        <article className="prose prose-neutral max-w-none dark:prose-invert">
          {body.split("\n\n").map((paragraph, index) => {
            const trimmed = paragraph.trim();

            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={index}
                  className="mb-3 mt-8 text-2xl font-semibold tracking-tight text-foreground"
                >
                  {trimmed.replace(/^## /, "")}
                </h2>
              );
            }

            if (trimmed.startsWith("- ")) {
              const listItems = trimmed.split("\n").filter((line) => line.startsWith("- "));
              return (
                <ul key={index} className="my-4 list-disc space-y-2 pl-6 text-muted-foreground">
                  {listItems.map((line, li) => (
                    <li key={li} className="text-base leading-7">
                      {line.replace(/^- /, "")}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={index} className="my-4 text-base leading-7 text-muted-foreground">
                {trimmed}
              </p>
            );
          })}
        </article>

        {tags.length ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Tag className="h-4 w-4" />
              {t("postDetail.tags")}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
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

        {questions.length ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4" />
              {t("postDetail.assessment.heading", {
                current: String(currentQuestionIndex + 1),
                total: String(questions.length),
              })}
            </div>

            <AssessmentPromptCard
              question={currentQuestion}
              selectedOptionId={selectedOptionId}
              answeredOptionId={currentAnswerId}
              title={t("postDetail.assessment.title")}
              continueHint={t("postDetail.assessment.continueHint")}
              onSelect={setSelectedOptionId}
              onSubmit={submitAnswer}
            />

            {currentAnswerId && currentQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={goToNextQuestion}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("postDetail.assessment.next")}
              </button>
            ) : null}
          </section>
        ) : null}

        <div className="border-t border-border pt-6">
          <Link
            to="/app/posts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("postDetail.back")}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PostDetail;
