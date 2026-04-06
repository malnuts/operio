import { useCallback, useEffect, useState } from "react";

import {
  getLearnerProgressSummary,
  readLearnerProgress,
  recordAssessmentAttempt,
  recordProcedureVisit,
  saveLearnerProgress,
  type AssessmentHistoryRecord,
  type LearnerProgressState,
} from "@/lib/learner-progress";

export const useLearnerProgress = () => {
  const [progress, setProgress] = useState<LearnerProgressState>(() => readLearnerProgress());

  useEffect(() => {
    saveLearnerProgress(progress);
  }, [progress]);

  const trackProcedureVisit = useCallback((procedureId: string, completed = false) => {
    setProgress((current) => recordProcedureVisit(current, procedureId, completed));
  }, []);

  const trackAssessmentAttempt = useCallback(
    (attempt: Omit<AssessmentHistoryRecord, "answeredAt"> & { answeredAt?: string }) => {
      setProgress((current) => recordAssessmentAttempt(current, attempt));
    },
    [],
  );

  const isProcedureCompleted = useCallback(
    (procedureId: string) => Boolean(progress.procedures[procedureId]?.completed),
    [progress.procedures],
  );

  return {
    progress,
    summary: getLearnerProgressSummary(progress),
    trackProcedureVisit,
    trackAssessmentAttempt,
    isProcedureCompleted,
  };
};
