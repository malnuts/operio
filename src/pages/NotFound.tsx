import { Link } from "react-router-dom";

import { useI18n } from "@/hooks/useI18n";

const NotFound = () => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("notFound.description")}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t("notFound.action")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
