import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { productRoutes } from "@/lib/product-language";

const Index = lazy(() => import("./pages/Index.tsx"));
const Anatomy = lazy(() => import("./pages/Anatomy.tsx"));
const LearnerHome = lazy(() => import("./pages/LearnerHome.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const PostDetail = lazy(() => import("./pages/PostDetail.tsx"));
const PostLibrary = lazy(() => import("./pages/PostLibrary.tsx"));
const ProcedureDetail = lazy(() => import("./pages/ProcedureDetail.tsx"));
const ProcedureLibrary = lazy(() => import("./pages/ProcedureLibrary.tsx"));
const ReviewMode = lazy(() => import("./pages/ReviewMode.tsx"));
const RoutePlaceholderPage = lazy(() => import("./pages/RoutePlaceholderPage.tsx"));
const CreatorWorkspacePage = lazy(() => import("./features/creator/CreatorWorkspacePage.tsx"));
const CreatorEditorPage = lazy(() => import("./features/creator/CreatorEditorPage.tsx"));
const CreatorLibraryPage = lazy(() => import("./features/creator/CreatorLibraryPage.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <I18nProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Suspense
          fallback={(
            <div className="min-h-screen bg-background px-6 py-16 text-foreground">
              <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">
                Loading page...
              </div>
            </div>
          )}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/app" element={<LearnerHome />} />
            <Route path="/app/procedures" element={<ProcedureLibrary />} />
            <Route path="/app/procedure/:id" element={<ProcedureDetail />} />
            <Route path="/app/anatomy/:id" element={<Anatomy />} />
            <Route path="/app/posts" element={<PostLibrary />} />
            <Route path="/app/post/:id" element={<PostDetail />} />
            <Route path="/app/review" element={<ReviewMode />} />
            <Route path="/creator" element={<CreatorWorkspacePage />} />
            <Route path="/creator/new" element={<CreatorEditorPage />} />
            <Route path="/creator/library" element={<CreatorLibraryPage />} />
            {productRoutes.filter((route) => !["/app", "/app/procedures", "/app/procedure/:id", "/app/anatomy/:id", "/app/posts", "/app/post/:id", "/app/review", "/creator", "/creator/new", "/creator/library"].includes(route.path)).map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<RoutePlaceholderPage route={route} />}
              />
            ))}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </I18nProvider>
);

export default App;
