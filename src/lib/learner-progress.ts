import { z } from "zod";

export const LEARNER_PROGRESS_STORAGE_KEY = "operio.learner-progress";

const procedureProgressRecordSchema = z.object({
  procedureId: z.string(),
  completed: z.boolean(),
  completedAt: z.string().optional(),
  lastVisitedAt: z.string(),
});

const assessmentHistoryRecordSchema = z.object({
  questionId: z.string(),
  contentId: z.string(),
  contentType: z.enum(["procedure", "post", "assessment"]),
  selectedOption: z.string(),
  isCorrect: z.boolean(),
  answeredAt: z.string(),
});

const learnerProgressStateSchema = z.object({
  procedures: z.record(z.string(), procedureProgressRecordSchema),
  assessmentHistory: z.array(assessmentHistoryRecordSchema),
});

export type ProcedureProgressRecord = z.infer<typeof procedureProgressRecordSchema>;
export type AssessmentHistoryRecord = z.infer<typeof assessmentHistoryRecordSchema>;
export type LearnerProgressState = z.infer<typeof learnerProgressStateSchema>;

export const createEmptyLearnerProgress = (): LearnerProgressState => ({
  procedures: {},
  assessmentHistory: [],
});

export const parseLearnerProgress = (value: string | null): LearnerProgressState => {
  if (!value) {
    return createEmptyLearnerProgress();
  }

  try {
    const result = learnerProgressStateSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : createEmptyLearnerProgress();
  } catch {
    return createEmptyLearnerProgress();
  }
};

export const readLearnerProgress = (): LearnerProgressState => {
  if (typeof window === "undefined") {
    return createEmptyLearnerProgress();
  }

  return parseLearnerProgress(window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY));
};

export const saveLearnerProgress = (value: LearnerProgressState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LEARNER_PROGRESS_STORAGE_KEY, JSON.stringify(value));
};

export const recordProcedureVisit = (
  state: LearnerProgressState,
  procedureId: string,
  completed = false,
  occurredAt = new Date().toISOString(),
): LearnerProgressState => ({
  ...state,
  procedures: {
    ...state.procedures,
    [procedureId]: {
      procedureId,
      completed: completed || state.procedures[procedureId]?.completed || false,
      completedAt: completed ? occurredAt : state.procedures[procedureId]?.completedAt,
      lastVisitedAt: occurredAt,
    },
  },
});

export const recordAssessmentAttempt = (
  state: LearnerProgressState,
  attempt: Omit<AssessmentHistoryRecord, "answeredAt"> & { answeredAt?: string },
): LearnerProgressState => ({
  ...state,
  assessmentHistory: [
    {
      ...attempt,
      answeredAt: attempt.answeredAt ?? new Date().toISOString(),
    },
    ...state.assessmentHistory,
  ],
});

export const getLearnerProgressSummary = (state: LearnerProgressState) => {
  const procedureRecords = Object.values(state.procedures);
  const completedProcedures = procedureRecords.filter((record) => record.completed).length;
  const procedureAccuracy = state.assessmentHistory.length
    ? Math.round(
        (state.assessmentHistory.filter((record) => record.isCorrect).length /
          state.assessmentHistory.length) *
          100,
      )
    : 0;

  return {
    trackedProcedures: procedureRecords.length,
    completedProcedures,
    assessmentCount: state.assessmentHistory.length,
    procedureAccuracy,
    recentAssessment: state.assessmentHistory[0] ?? null,
  };
};
