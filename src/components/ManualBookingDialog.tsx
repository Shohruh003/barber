import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, User, Clock, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createManualBooking } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";
import toast from "react-hot-toast";

interface ManualBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
  selectedDate: string;
  selectedTime: string;
  services: Service[];
  onSuccess?: () => void;
}

export function ManualBookingDialog({
  open,
  onOpenChange,
  barberId,
  selectedDate,
  selectedTime,
  services,
  onSuccess,
}: ManualBookingDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "uz" | "ru";
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("+998");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
  };

  const totalPrice = selectedServices.reduce((s, svc) => s + svc.price, 0);
  const totalDuration = selectedServices.reduce((s, svc) => s + svc.duration, 0);

  const getServiceName = (s: Service) =>
    lang === "uz" ? s.nameUz || s.name : lang === "ru" ? s.nameRu || s.name : s.name;

  const handleSubmit = async () => {
    if (!guestName.trim() || guestPhone.length < 9) {
      toast.error(t("barberApp.fillAllFields"));
      return;
    }

    setLoading(true);
    try {
      await createManualBooking({
        barberId,
        date: selectedDate,
        time: selectedTime,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          nameUz: s.nameUz,
          nameRu: s.nameRu,
          price: s.price,
          duration: s.duration,
          icon: s.icon,
        })),
        totalPrice,
        totalDuration,
      });
      toast.success(t("barberPanel.slotBlocked"));
      setGuestName("");
      setGuestPhone("+998");
      setSelectedServices([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {t("barberApp.manualBooking")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Selected time display */}
          <div className="flex items-center gap-2 justify-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{selectedDate}</span>
            <Badge variant="outline" className="font-mono text-base px-3 py-1">
              {selectedTime}
            </Badge>
          </div>

          {/* Guest name */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <User className="h-4 w-4" />
              {t("barberApp.clientName")}
            </Label>
            <Input
              placeholder="Ism kiriting..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="h-11 text-base"
              autoFocus
            />
          </div>

          {/* Guest phone */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-4 w-4" />
              {t("barberApp.clientPhone")}
            </Label>
            <Input
              type="tel"
              placeholder="+998901234567"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          {/* Services selection */}
          {services.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("barberApp.selectServices")}
              </Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {services.map((service) => {
                  const isSelected = selectedServices.some((s) => s.id === service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        "w-full flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="text-lg">{service.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getServiceName(service)}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration} {t("barberPanel.minutes")} — {service.price.toLocaleString()} {t("common.currency")}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total */}
          {selectedServices.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">
                {selectedServices.length} {t("barberApp.servicesSelected")} — {totalDuration} {t("barberPanel.minutes")}
              </span>
              <span className="font-bold text-primary">
                {totalPrice.toLocaleString()} {t("common.currency")}
              </span>
            </div>
          )}

          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleSubmit}
            disabled={loading || !guestName.trim()}
          >
            {loading ? t("common.loading") : t("barberApp.createBooking")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
