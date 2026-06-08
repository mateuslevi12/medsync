import * as React from "react";
import { Input } from "@/components/ui/input";
import { limitLength } from "@/lib/input-sanitizers";

type MaskedInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  mask?: (value: string) => string;
  sanitizer?: (value: string) => string;
  maxLength?: number;
  error?: string;
};

function applyTransform(
  value: string,
  {
    mask,
    sanitizer,
    maxLength,
  }: Pick<MaskedInputProps, "mask" | "sanitizer" | "maxLength">
) {
  let next = sanitizer ? sanitizer(value) : value;
  if (typeof maxLength === "number") {
    next = limitLength(next, maxLength);
  }
  return mask ? mask(next) : next;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value, onChange, mask, sanitizer, maxLength, error, onPaste, className, ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        className={className}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => {
          onChange(applyTransform(event.target.value, { mask, sanitizer, maxLength }));
        }}
        onPaste={(event) => {
          const pastedText = event.clipboardData.getData("text");
          const transformed = applyTransform(pastedText, { mask, sanitizer, maxLength });
          event.preventDefault();
          onChange(transformed);
          onPaste?.(event);
        }}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
