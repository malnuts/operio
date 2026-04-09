import "./features/agent/init";
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentChatProvider } from "@/features/agent/AgentChatProvider";
import AgentChatPanel from "@/features/agent/AgentChatPanel";
import { useI18n } from "@/hooks/useI18n";
import { I18nProvider } from "@/lib/i18n";

const Index = lazy(() => import("./pages/Index.tsx"));
const Anatomy = lazy(() => import("./pages/Anatomy.tsx"));
const LearnerHome = lazy(() => import("./pages/LearnerHome.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const PostDetail = lazy(() => import("./pages/PostDetail.tsx"));
const PostLibrary = lazy(() => import("./pages/PostLibrary.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const ProcedureDetail = lazy(() => import("./pages/ProcedureDetail.tsx"));
const ProcedureLibrary = lazy(() => import("./pages/ProcedureLibrary.tsx"));
const ReviewMode = lazy(() => import("./pages/ReviewMode.tsx"));
const CreatorWorkspacePage = lazy(() => import("./features/creator/CreatorWorkspacePage.tsx"));
const CreatorEditorPage = lazy(() => import("./features/creator/CreatorEditorPage.tsx"));
const CreatorLibraryPage = lazy(() => import("./features/creator/CreatorLibraryPage.tsx"));
const AgentDraftPage = lazy(() => import("./features/agent/AgentDraftPage.tsx"));
const AgentReviewPage = lazy(() => import("./features/agent/AgentReviewPage.tsx"));

const AppLoadingFallback = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
        {t("app.loadingPage")}
      </div>
    </div>
  );
};

const App = () => (
  <I18nProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AgentChatProvider>
        <Suspense fallback={<AppLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/app" element={<LearnerHome />} />
            <Route path="/app/procedures" element={<ProcedureLibrary />} />
            <Route path="/app/procedure/:id" element={<ProcedureDetail />} />
            <Route path="/app/anatomy/:id" element={<Anatomy />} />
            <Route path="/app/posts" element={<PostLibrary />} />
            <Route path="/app/post/:id" element={<PostDetail />} />
            <Route path="/app/review" element={<ReviewMode />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/creator" element={<CreatorWorkspacePage />} />
            <Route path="/creator/new" element={<CreatorEditorPage />} />
            <Route path="/creator/library" element={<CreatorLibraryPage />} />
            <Route path="/creator/agent" element={<AgentDraftPage />} />
            <Route path="/creator/agent/review" element={<AgentReviewPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <AgentChatPanel />
        </AgentChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </I18nProvider>
);

export default App;
