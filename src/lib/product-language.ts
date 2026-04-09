export type ProductTerm = {
  id: "procedure" | "post" | "assessment" | "creator" | "learner";
  termKey: string;
  definitionKey: string;
};

export type ProductRoute = {
  id:
    | "learnerHome"
    | "procedureLibrary"
    | "procedureDetail"
    | "postLibrary"
    | "postDetail"
    | "review"
    | "anatomy"
    | "creatorWorkspace"
    | "creatorNew"
    | "creatorLibrary"
    | "pricing";
  path: string;
  labelKey: string;
  titleKey: string;
  summaryKey: string;
  audience: "learner" | "creator" | "shared";
};

export type DomainAssumption = {
  id:
    | "launchDataset"
    | "optionalReference"
    | "assessmentReinforcement"
    | "creatorRoles";
  assumptionKey: string;
  classification: "launch-specific" | "architecture-level";
  noteKey: string;
};

export const productTerminology: ProductTerm[] = [
  {
    id: "procedure",
    termKey: "product.term.procedure.label",
    definitionKey: "product.term.procedure.definition",
  },
  {
    id: "post",
    termKey: "product.term.post.label",
    definitionKey: "product.term.post.definition",
  },
  {
    id: "assessment",
    termKey: "product.term.assessment.label",
    definitionKey: "product.term.assessment.definition",
  },
  {
    id: "creator",
    termKey: "product.term.creator.label",
    definitionKey: "product.term.creator.definition",
  },
  {
    id: "learner",
    termKey: "product.term.learner.label",
    definitionKey: "product.term.learner.definition",
  },
];

export const productRoutes: ProductRoute[] = [
  {
    id: "learnerHome",
    path: "/app",
    labelKey: "product.route.learnerHome.label",
    titleKey: "product.route.learnerHome.title",
    summaryKey: "product.route.learnerHome.summary",
    audience: "learner",
  },
  {
    id: "procedureLibrary",
    path: "/app/procedures",
    labelKey: "product.route.procedureLibrary.label",
    titleKey: "product.route.procedureLibrary.title",
    summaryKey: "product.route.procedureLibrary.summary",
    audience: "learner",
  },
  {
    id: "procedureDetail",
    path: "/app/procedure/:id",
    labelKey: "product.route.procedureDetail.label",
    titleKey: "product.route.procedureDetail.title",
    summaryKey: "product.route.procedureDetail.summary",
    audience: "learner",
  },
  {
    id: "postLibrary",
    path: "/app/posts",
    labelKey: "product.route.postLibrary.label",
    titleKey: "product.route.postLibrary.title",
    summaryKey: "product.route.postLibrary.summary",
    audience: "learner",
  },
  {
    id: "postDetail",
    path: "/app/post/:id",
    labelKey: "product.route.postDetail.label",
    titleKey: "product.route.postDetail.title",
    summaryKey: "product.route.postDetail.summary",
    audience: "learner",
  },
  {
    id: "review",
    path: "/app/review",
    labelKey: "product.route.review.label",
    titleKey: "product.route.review.title",
    summaryKey: "product.route.review.summary",
    audience: "learner",
  },
  {
    id: "anatomy",
    path: "/app/anatomy/:id",
    labelKey: "product.route.anatomy.label",
    titleKey: "product.route.anatomy.title",
    summaryKey: "product.route.anatomy.summary",
    audience: "learner",
  },
  {
    id: "creatorWorkspace",
    path: "/creator",
    labelKey: "product.route.creatorWorkspace.label",
    titleKey: "product.route.creatorWorkspace.title",
    summaryKey: "product.route.creatorWorkspace.summary",
    audience: "creator",
  },
  {
    id: "creatorNew",
    path: "/creator/new",
    labelKey: "product.route.creatorNew.label",
    titleKey: "product.route.creatorNew.title",
    summaryKey: "product.route.creatorNew.summary",
    audience: "creator",
  },
  {
    id: "creatorLibrary",
    path: "/creator/library",
    labelKey: "product.route.creatorLibrary.label",
    titleKey: "product.route.creatorLibrary.title",
    summaryKey: "product.route.creatorLibrary.summary",
    audience: "creator",
  },
  {
    id: "pricing",
    path: "/pricing",
    labelKey: "product.route.pricing.label",
    titleKey: "product.route.pricing.title",
    summaryKey: "product.route.pricing.summary",
    audience: "shared",
  },
];

export const domainAssumptions: DomainAssumption[] = [
  {
    id: "launchDataset",
    assumptionKey: "product.assumption.launchDataset.assumption",
    classification: "launch-specific",
    noteKey: "product.assumption.launchDataset.note",
  },
  {
    id: "optionalReference",
    assumptionKey: "product.assumption.optionalReference.assumption",
    classification: "architecture-level",
    noteKey: "product.assumption.optionalReference.note",
  },
  {
    id: "assessmentReinforcement",
    assumptionKey: "product.assumption.assessmentReinforcement.assumption",
    classification: "architecture-level",
    noteKey: "product.assumption.assessmentReinforcement.note",
  },
  {
    id: "creatorRoles",
    assumptionKey: "product.assumption.creatorRoles.assumption",
    classification: "architecture-level",
    noteKey: "product.assumption.creatorRoles.note",
  },
];
