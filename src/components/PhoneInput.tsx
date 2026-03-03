import { forwardRef, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PREFIX = "+998";

/** Format raw digits (after +998) into XX-XXX-XX-XX */
function formatPhoneDisplay(raw: string): string {
  // raw = digits only, max 9 chars
  const d = raw.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7)}`;
}

/** Extract digits after +998 from any phone string */
function extractDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  // If starts with 998, strip it
  if (digits.startsWith("998")) return digits.slice(3, 12);
  return digits.slice(0, 9);
}

/** Convert display value back to raw phone for backend: +998XXXXXXXXX */
export function phoneToRaw(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.startsWith("998")) return `+${digits}`;
  return `+998${digits}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, placeholder, disabled }, ref) => {
    const digits = extractDigits(value || "");
    const display = `${PREFIX}${formatPhoneDisplay(digits)}`;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      // Don't allow deleting the prefix
      if (inputVal.length < PREFIX.length) return;

      const afterPrefix = inputVal.slice(PREFIX.length);
      const newDigits = afterPrefix.replace(/\D/g, "").slice(0, 9);
      // Store as formatted display value - will be converted to raw on submit
      onChange(`${PREFIX}${formatPhoneDisplay(newDigits)}`);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder || "+998XX-XXX-XX-XX"}
        disabled={disabled}
        className={cn("h-11", className)}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
