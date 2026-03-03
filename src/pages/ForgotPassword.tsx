import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Smartphone, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, phoneToRaw } from "@/components/PhoneInput";
import { OtpInput } from "@/components/OtpInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { sendResetCodeAPI, verifyResetCodeAPI, resetPasswordAPI } from "@/lib/apiClient";
import { forgotPasswordSchema, newPasswordSchema } from "@/lib/validation";
import type { ForgotPasswordFormData, NewPasswordFormData } from "@/lib/validation";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<"phone" | "otp" | "newPassword">("phone");
  const [phone, setPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const phoneForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const passwordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  // Countdown timer
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: send code
  const onSubmitPhone = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      const rawPhone = phoneToRaw(data.phone);
      await sendResetCodeAPI(rawPhone);
      setPhone(rawPhone);
      setStep("otp");
      setCountdown(60);
      toast.success(t("auth.codeSent"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.error");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: verify code
  const onVerifyOtp = async () => {
    if (otpValue.length !== 4) return;
    try {
      setIsSubmitting(true);
      await verifyResetCodeAPI(phone, otpValue);
      setStep("newPassword");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("auth.wrongCode");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: reset password
  const onResetPassword = async (data: NewPasswordFormData) => {
    try {
      setIsSubmitting(true);
      await resetPasswordAPI(phone, data.password);
      toast.success(t("auth.passwordReset"));
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.error");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await sendResetCodeAPI(phone);
      setCountdown(60);
      setOtpValue("");
      toast.success(t("auth.codeSent"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.error");
      toast.error(message);
    }
  };

  // Step 3: New password form
  if (step === "newPassword") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("auth.newPassword")}</CardTitle>
            <CardDescription>{t("auth.newPasswordSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    {...passwordForm.register("password")}
                    aria-invalid={!!passwordForm.formState.errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("auth.confirmPassword")}</Label>
                <Input
                  type="password"
                  placeholder="••••••"
                  {...passwordForm.register("confirmPassword")}
                  aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? t("common.loading") : t("auth.resetPassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: OTP verification
  if (step === "otp") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("auth.verifyPhone")}</CardTitle>
            <CardDescription>
              {t("auth.codeSentTo")} {phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OtpInput value={otpValue} onChange={setOtpValue} disabled={isSubmitting} />

            <Button
              className="w-full h-11"
              disabled={otpValue.length !== 4 || isSubmitting}
              onClick={onVerifyOtp}
            >
              {isSubmitting ? t("common.loading") : t("auth.verify")}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {countdown > 0 ? (
                <span>{t("auth.resendIn")} {countdown} {t("auth.seconds")}</span>
              ) : (
                <button onClick={handleResend} className="text-primary hover:underline">
                  {t("auth.resendCode")}
                </button>
              )}
            </div>

            <button
              onClick={() => { setStep("phone"); setOtpValue(""); }}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Phone input
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>{t("auth.forgotPasswordSub")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.phone")}</Label>
              <Controller
                name="phone"
                control={phoneForm.control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {phoneForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("auth.sendCode")}
            </Button>
          </form>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.backToLogin")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
