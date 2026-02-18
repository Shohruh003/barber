import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-primary/20">404</h1>
        <h2 className="text-2xl font-semibold">
          {t("common.noResults")}
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {t("common.error")}
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            {t("nav.home")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
