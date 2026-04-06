import { BookOpen, BrainCircuit, Microscope, ScanSearch, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";

const learnerEntryPoints = [
  {
    title: "Procedures",
    description: "Open structured procedure walkthroughs with explanations and decision moments.",
    href: "/app/procedures",
    icon: Stethoscope,
  },
  {
    title: "Posts",
    description: "Read clinical posts and practical writeups that extend beyond procedure playback.",
    href: "/app/posts",
    icon: BookOpen,
  },
  {
    title: "Review",
    description: "Return to answered questions and revisit content that still needs repetition.",
    href: "/app/review",
    icon: BrainCircuit,
  },
  {
    title: "Anatomy Reference",
    description: "Jump into visual reference content that supports surrounding clinical lessons.",
    href: "/app/anatomy/sample",
    icon: ScanSearch,
  },
];

const formatRecentAssessment = (questionId: string | undefined) => {
  if (!questionId) {
    return "No assessments answered yet.";
  }

  return `Most recent assessment: ${questionId}`;
};

const LearnerHome = () => {
  const { summary } = useLearnerProgress();
  const completionPercent = summary.trackedProcedures
    ? Math.round((summary.completedProcedures / summary.trackedProcedures) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="grid gap-6 rounded-3xl border border-border bg-card/60 p-8 shadow-sm lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              <Microscope className="h-3.5 w-3.5" />
              Learner Shell
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Study procedures first, then reinforce with review and reference.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                Operio keeps the learner flow centered on structured clinical content while still
                making room for posts, assessment review, and optional visual anatomy support.
              </p>
            </div>
          </div>

          <Card className="border-primary/15 bg-background/80">
            <CardHeader>
              <CardTitle className="text-xl">Learning progress</CardTitle>
              <CardDescription>
                Stored locally so learner progress persists across procedures and assessments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Completed procedures</p>
                  <p className="mt-2 text-3xl font-semibold">{summary.completedProcedures}</p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Answered assessments</p>
                  <p className="mt-2 text-3xl font-semibold">{summary.assessmentCount}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Procedure completion</span>
                  <span className="font-medium">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} aria-label="Procedure completion progress" />
              </div>

              <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                {formatRecentAssessment(summary.recentAssessment?.questionId)}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Start from the right surface</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Each entry point is explicit so the learner shell can grow into dedicated route
              experiences without losing a clear navigation model.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {learnerEntryPoints.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.href} to={item.href} className="group">
                  <Card className="h-full border-border/70 transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <CardDescription className="text-sm leading-6">
                          {item.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                        Open route
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default LearnerHome;
