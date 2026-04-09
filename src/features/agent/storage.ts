/**
 * localStorage persistence for agent job records and review queue state.
 */

import { z } from "zod";

import { agentJobRecordSchema, type AgentJobRecord, type ProvenanceStatus } from "./types";

export const AGENT_JOBS_STORAGE_KEY = "operio.agent-jobs";

const agentJobsStateSchema = z.object({
  jobs: z.array(agentJobRecordSchema),
});
type AgentJobsState = z.infer<typeof agentJobsStateSchema>;

const empty = (): AgentJobsState => ({ jobs: [] });

const sortByDate = (jobs: AgentJobRecord[]) =>
  [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const readAgentJobs = (): AgentJobsState => {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(AGENT_JOBS_STORAGE_KEY);
    if (!raw) return empty();
    const parsed = agentJobsStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { jobs: sortByDate(parsed.data.jobs) } : empty();
  } catch {
    return empty();
  }
};

export const saveAgentJobs = (state: AgentJobsState): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AGENT_JOBS_STORAGE_KEY, JSON.stringify(state));
};

export const upsertAgentJob = (job: AgentJobRecord): AgentJobsState => {
  const state = readAgentJobs();
  const next = {
    jobs: sortByDate([job, ...state.jobs.filter((j) => j.id !== job.id)]),
  };
  saveAgentJobs(next);
  return next;
};

export const getAgentJob = (id: string): AgentJobRecord | null =>
  readAgentJobs().jobs.find((j) => j.id === id) ?? null;

export const getReviewQueue = (): AgentJobRecord[] =>
  readAgentJobs().jobs.filter(
    (j) => j.status === "succeeded" && j.provenance?.status === "pending_review",
  );

export const getJobsByReviewStatus = (status: ProvenanceStatus): AgentJobRecord[] =>
  readAgentJobs().jobs.filter(
    (j) => j.provenance?.status === status,
  );

export const updateJobReviewStatus = (
  jobId: string,
  status: ProvenanceStatus,
  reviewedBy?: string,
): AgentJobRecord | null => {
  const job = getAgentJob(jobId);
  if (!job?.provenance) return null;
  const updated: AgentJobRecord = {
    ...job,
    provenance: {
      ...job.provenance,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy ?? "creator",
    },
  };
  upsertAgentJob(updated);
  return updated;
};

export const addHumanEdit = (
  jobId: string,
  fieldPath: string,
  summary: string,
): AgentJobRecord | null => {
  const job = getAgentJob(jobId);
  if (!job?.provenance) return null;
  const updated: AgentJobRecord = {
    ...job,
    provenance: {
      ...job.provenance,
      status: "revised_by_human",
      humanEdits: [
        ...job.provenance.humanEdits,
        { editedAt: new Date().toISOString(), fieldPath, summary },
      ],
    },
  };
  upsertAgentJob(updated);
  return updated;
};
