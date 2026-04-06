import type { ReviewRecord } from "@/types/content";

export const LEARNER_PROGRESS_STORAGE_KEY = "operio.learner-progress";

export type ProcedureProgressRecord = {
  procedureId: string;
  completed: boolean;
  completedAt?: string;
  lastVisitedAt: string;
};

export type AssessmentHistoryRecord = {
  questionId: string;
  contentId: string;
  contentType: ReviewRecord["contentType"];
  selectedOption: string;
  isCorrect: boolean;
  answeredAt: string;
};

export type LearnerProgressState = {
  procedures: Record<string, ProcedureProgressRecord>;
  assessmentHistory: AssessmentHistoryRecord[];
};

export const createEmptyLearnerProgress = (): LearnerProgressState => ({
  procedures: {},
  assessmentHistory: [],
});

export const parseLearnerProgress = (value: string | null): LearnerProgressState => {
  if (!value) {
    return createEmptyLearnerProgress();
  }

  try {
    const parsed = JSON.parse(value) as Partial<LearnerProgressState>;

    return {
      procedures: parsed.procedures ?? {},
      assessmentHistory: parsed.assessmentHistory ?? [],
    };
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
