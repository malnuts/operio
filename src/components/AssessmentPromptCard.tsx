import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import type { NormalizedQuestion } from "@/lib/procedure-data";

type AssessmentPromptCardProps = {
  question: NormalizedQuestion;
  selectedOptionId: string | null;
  answeredOptionId?: string;
  title?: string;
  submitLabel?: string;
  continueHint?: string;
  onSelect: (optionId: string) => void;
  onSubmit: () => void;
};

const AssessmentPromptCard = ({
  question,
  selectedOptionId,
  answeredOptionId,
  title,
  submitLabel,
  continueHint,
  onSelect,
  onSubmit,
}: AssessmentPromptCardProps) => {
  const { t } = useI18n();
  const answeredOption = question.options.find((option) => option.id === answeredOptionId);
  const resolvedTitle = title ?? t("assessment.prompt.title");
  const resolvedSubmitLabel = submitLabel ?? t("assessment.prompt.submit");
  const resolvedContinueHint = continueHint ?? t("assessment.prompt.continueHint");

  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5" data-testid="assessment-prompt-card">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <FileText className="h-4 w-4" />
        {resolvedTitle}
      </div>
      <h2 className="mt-3 text-xl font-semibold">{question.stem}</h2>
      <div className="mt-4 space-y-3">
        {question.options.map((option) => {
          const answered = Boolean(answeredOptionId);
          const isSelected = option.id === (answeredOptionId ?? selectedOptionId);
          const isCorrect = answered && option.isCorrect;
          const isIncorrectSelection = answered && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              onClick={() => onSelect(option.id)}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-50"
                  : isIncorrectSelection
                    ? "border-destructive bg-destructive/5"
                    : isSelected
                      ? "border-primary bg-background"
                      : "border-border bg-background"
              }`}
            >
              <div className="grid grid-cols-[1.5rem_1fr] items-start gap-x-4">
                <p className="pt-0.5 text-xs tracking-[0.18em] text-muted-foreground">
                  {option.label}
                </p>
                <p className="text-base font-medium leading-6 text-foreground">{option.text}</p>
              </div>
            </button>
          );
        })}
      </div>

      {!answeredOptionId ? (
        <>
          <Button className="mt-4" disabled={!selectedOptionId} onClick={onSubmit}>
            {resolvedSubmitLabel}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">{resolvedContinueHint}</p>
        </>
      ) : null}

      {answeredOption ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-medium">
            {answeredOption.isCorrect
              ? t("assessment.prompt.result.correct")
              : t("assessment.prompt.result.incorrect")}
          </p>

          {question.explanation?.correctReasoning ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("assessment.prompt.note.teaching")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{question.explanation.correctReasoning}</p>
            </div>
          ) : null}

          {question.explanation?.clinicalPrinciple ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("assessment.prompt.note.clinicalPrinciple")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{question.explanation.clinicalPrinciple}</p>
            </div>
          ) : null}

          {question.explanation?.boardTip ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("assessment.prompt.note.examStrategy")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{question.explanation.boardTip}</p>
            </div>
          ) : null}

          {question.explanation?.distractorBreakdowns?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("assessment.prompt.note.optionBreakdowns")}</p>
              <div className="space-y-2">
                {question.explanation.distractorBreakdowns.map((item) => (
                  <div key={`${question.id}-${item.label}`} className="rounded-2xl bg-muted/60 p-3 text-sm">
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 leading-6 text-muted-foreground">{item.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default AssessmentPromptCard;
