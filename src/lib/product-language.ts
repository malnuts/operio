export type ProductTerm = {
  term: "procedure" | "post" | "assessment" | "creator" | "learner";
  definition: string;
};

export type ProductRoute = {
  path: string;
  label: string;
  title: string;
  summary: string;
  audience: "learner" | "creator" | "shared";
};

export type DomainAssumption = {
  assumption: string;
  classification: "launch-specific" | "architecture-level";
  note: string;
};

export const productTerminology: ProductTerm[] = [
  {
    term: "procedure",
    definition: "A structured, expert-led clinical learning experience with chapters, media, and embedded decision points.",
  },
  {
    term: "post",
    definition: "A text-and-photo educational article, case reflection, or practical write-up that extends learning beyond procedures.",
  },
  {
    term: "assessment",
    definition: "A question flow that reinforces learning in context instead of defining the product on its own.",
  },
  {
    term: "creator",
    definition: "An educator or clinical expert who publishes procedures, posts, and linked assessments.",
  },
  {
    term: "learner",
    definition: "A student or clinician using Operio to study procedures, review posts, and track progress.",
  },
];

export const productRoutes: ProductRoute[] = [
  {
    path: "/app",
    label: "Learner Home",
    title: "Learner Home",
    summary: "The main learner dashboard with entry points into procedures, posts, review, and reference content.",
    audience: "learner",
  },
  {
    path: "/app/procedures",
    label: "Procedures",
    title: "Procedure Library",
    summary: "Browse procedure-based learning content organized for clinical study and repetition.",
    audience: "learner",
  },
  {
    path: "/app/procedure/:id",
    label: "Procedure Detail",
    title: "Procedure Detail",
    summary: "Open a specific procedure with chapters, media, and embedded assessment moments.",
    audience: "learner",
  },
  {
    path: "/app/posts",
    label: "Posts",
    title: "Clinical Posts",
    summary: "Read clinical posts, case reflections, and educational articles connected to the learning journey.",
    audience: "learner",
  },
  {
    path: "/app/post/:id",
    label: "Post Detail",
    title: "Post Detail",
    summary: "Open a specific post with author context, media, and optional linked assessment.",
    audience: "learner",
  },
  {
    path: "/app/review",
    label: "Review",
    title: "Review",
    summary: "Return to completed questions and revisit weak areas across procedures and posts.",
    audience: "learner",
  },
  {
    path: "/app/anatomy/:id",
    label: "Anatomy",
    title: "Anatomy Reference",
    summary: "View optional anatomy or visual reference content that supports the surrounding lesson.",
    audience: "learner",
  },
  {
    path: "/creator",
    label: "Creator Workspace",
    title: "Creator Workspace",
    summary: "Enter the publishing workspace for building procedures and clinical posts.",
    audience: "creator",
  },
  {
    path: "/creator/new",
    label: "New Content",
    title: "Create New Content",
    summary: "Start a new procedure or clinical post flow from the creator workspace.",
    audience: "creator",
  },
  {
    path: "/creator/library",
    label: "Creator Library",
    title: "Creator Library",
    summary: "Manage drafts, published items, and reusable creator assets.",
    audience: "creator",
  },
  {
    path: "/pricing",
    label: "Pricing",
    title: "Pricing",
    summary: "Explain learner access tiers and creator economics.",
    audience: "shared",
  },
];

export const domainAssumptions: DomainAssumption[] = [
  {
    assumption: "Dental procedures, models, and question sets are the initial dataset in this repo.",
    classification: "launch-specific",
    note: "Keep the content source narrow for launch, but do not hardcode dental-only language into shared product concepts.",
  },
  {
    assumption: "Anatomy and 3D reference modules may be attached to some learning experiences.",
    classification: "architecture-level",
    note: "Treat visual reference as optional support content rather than the core definition of the product.",
  },
  {
    assumption: "Assessments reinforce content comprehension within procedures and posts.",
    classification: "architecture-level",
    note: "Do not let exam-style practice become the entire product identity.",
  },
  {
    assumption: "Clinical creators publish structured educational content for learners.",
    classification: "architecture-level",
    note: "Creator and learner roles should remain reusable outside the first domain vertical.",
  },
];
