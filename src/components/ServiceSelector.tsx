import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

interface ServiceSelectorProps {
  services: Service[];
  selected: Service[];
  onToggle: (service: Service) => void;
}

export function ServiceSelector({
  services,
  selected,
  onToggle,
}: ServiceSelectorProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "uz" | "ru";

  const getServiceName = (s: Service) => {
    if (lang === "uz") return s.nameUz;
    if (lang === "ru") return s.nameRu;
    return s.name;
  };

  const getServiceDesc = (s: Service) => {
    if (lang === "uz") return s.descriptionUz;
    if (lang === "ru") return s.descriptionRu;
    return s.description;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + " " + t("common.currency");
  };

  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selected.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {lang === "uz"
          ? "Bir nechta xizmatni tanlashingiz mumkin"
          : lang === "ru"
            ? "Можно выбрать несколько услуг"
            : "You can select multiple services"}
      </p>

      <div className="grid gap-3">
        {services.map((service) => {
          const isSelected = selected.some((s) => s.id === service.id);
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service)}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border",
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30",
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
              <span className="text-2xl">{service.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium">{getServiceName(service)}</h4>
                  <span className="font-semibold text-primary whitespace-nowrap">
                    {formatPrice(service.price)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {getServiceDesc(service)}
                </p>
                <span className="text-xs text-muted-foreground">
                  {service.duration} {t("booking.duration")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {lang === "uz"
                ? `${selected.length} ta xizmat tanlandi`
                : lang === "ru"
                  ? `Выбрано услуг: ${selected.length}`
                  : `${selected.length} service(s) selected`}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalDuration} {t("booking.duration")}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>{t("booking.price")}:</span>
            <span className="text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
