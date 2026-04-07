import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { productRoutes } from "@/lib/product-language";
import Index from "./pages/Index.tsx";
import Anatomy from "./pages/Anatomy.tsx";
import LearnerHome from "./pages/LearnerHome.tsx";
import NotFound from "./pages/NotFound.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import PostLibrary from "./pages/PostLibrary.tsx";
import ProcedureDetail from "./pages/ProcedureDetail.tsx";
import ProcedureLibrary from "./pages/ProcedureLibrary.tsx";
import ReviewMode from "./pages/ReviewMode.tsx";
import RoutePlaceholderPage from "./pages/RoutePlaceholderPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<LearnerHome />} />
          <Route path="/app/procedures" element={<ProcedureLibrary />} />
          <Route path="/app/procedure/:id" element={<ProcedureDetail />} />
          <Route path="/app/anatomy/:id" element={<Anatomy />} />
          <Route path="/app/posts" element={<PostLibrary />} />
          <Route path="/app/post/:id" element={<PostDetail />} />
          <Route path="/app/review" element={<ReviewMode />} />
          {productRoutes.filter((route) => !["/app", "/app/procedures", "/app/procedure/:id", "/app/anatomy/:id", "/app/posts", "/app/post/:id", "/app/review"].includes(route.path)).map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<RoutePlaceholderPage route={route} />}
            />
          ))}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
