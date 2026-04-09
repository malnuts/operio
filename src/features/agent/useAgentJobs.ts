import { useCallback, useState } from "react";

import { runAgentJob } from "./runner";
import {
  getReviewQueue,
  readAgentJobs,
  updateJobReviewStatus,
  addHumanEdit as addHumanEditStorage,
} from "./storage";
import type { AgentJobInput, AgentJobRecord, ProvenanceStatus } from "./types";

export const useAgentJobs = () => {
  const [jobs, setJobs] = useState(() => readAgentJobs().jobs);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setJobs(readAgentJobs().jobs);
  }, []);

  const submit = useCallback(async (input: AgentJobInput): Promise<AgentJobRecord | null> => {
    setRunning(true);
    setError(null);
    try {
      const result = await runAgentJob(input);
      refresh();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      refresh();
      return null;
    } finally {
      setRunning(false);
    }
  }, [refresh]);

  const reviewQueue = useCallback(() => getReviewQueue(), []);

  const setReviewStatus = useCallback(
    (jobId: string, status: ProvenanceStatus) => {
      updateJobReviewStatus(jobId, status);
      refresh();
    },
    [refresh],
  );

  const addHumanEdit = useCallback(
    (jobId: string, fieldPath: string, summary: string) => {
      addHumanEditStorage(jobId, fieldPath, summary);
      refresh();
    },
    [refresh],
  );

  return { jobs, running, error, submit, refresh, reviewQueue, setReviewStatus, addHumanEdit };
};
