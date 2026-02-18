import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder, className }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") onSearch("");
          }}
          placeholder={placeholder || t("home.searchPlaceholder")}
          className="pl-10 pr-20 h-12 text-base rounded-full"
          aria-label={t("common.search")}
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1.5 rounded-full"
        >
          {t("common.search")}
        </Button>
      </div>
    </form>
  );
}
