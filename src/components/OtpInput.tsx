import { useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  length = 4,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join("").replace(/\s/g, "");
    onChange(newValue);
    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join("").replace(/\s/g, ""));
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join("").replace(/\s/g, ""));
      }
    } else if (e.key === "ArrowLeft") {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      focusInput(Math.min(pastedData.length, length - 1));
    }
  };

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit === " " ? "" : digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          className="w-14 h-14 text-center text-2xl font-bold"
        />
      ))}
    </div>
  );
}
