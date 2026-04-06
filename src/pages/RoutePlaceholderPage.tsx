import { Link } from "react-router-dom";
import { productRoutes, type ProductRoute } from "@/lib/product-language";

type RoutePlaceholderPageProps = {
  route: ProductRoute;
};

const relatedRoutes = (audience: ProductRoute["audience"]) =>
  productRoutes.filter((route) => route.audience === audience);

const RoutePlaceholderPage = ({ route }: RoutePlaceholderPageProps) => {
  const related = relatedRoutes(route.audience);

  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            {route.audience} route
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            {route.title}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {route.summary}
          </p>
          <div className="rounded-xl border border-border bg-card/70 p-4 text-sm text-muted-foreground">
            This workspace is available in the current preview, with richer route-specific tools and
            workflows still being shaped.
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">Related routes</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.path}
                to={item.path.replace(":id", "sample")}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default RoutePlaceholderPage;
