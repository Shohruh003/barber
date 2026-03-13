import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Edit3,
  Globe,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { getAvatarUrl, fetchMyBalance } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

const TELEGRAM_BOT_URL = "https://t.me/barberbook_support_bot";

export default function CustomerSettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchMyBalance()
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => setBalance(0));
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentLang = i18n.language;
  const languages = [
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Profile card */}
      <Card>
        <CardContent className="relative pt-5 pb-5">
          {/* Edit button top-right */}
          <button
            onClick={() => navigate("/customer/profile-edit")}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Edit3 className="h-4 w-4 text-primary" />
          </button>

          {/* Centered avatar + info */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={getAvatarUrl(user.avatar)} />
              <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-xl">{user.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
            </div>
            {balance !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{balance.toLocaleString()} so'm</span>
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline"
                >
                  To'ldirish
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">{t("barberApp.language")}</span>
          </div>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={cn(
                  "flex-1 rounded-xl border p-2.5 text-center transition-all touch-target",
                  currentLang === lang.code
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <p className="text-xs mt-0.5">{lang.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              <span className="font-semibold text-sm">{t("barberApp.theme")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {theme === "dark" ? t("barberApp.darkMode") : t("barberApp.lightMode")}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <a
            href="https://t.me/barberbook_support_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-sm">{t("barberApp.support")}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full h-12 text-base font-semibold"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        {t("barberApp.logout")}
      </Button>

      <div className="h-4" />
    </div>
  );
}
