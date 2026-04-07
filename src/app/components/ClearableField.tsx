import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { X } from "lucide-react";
import { cn } from "./ui/utils";

interface ClearableInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  clearLabel?: string;
  wrapperClassName?: string;
}

interface ClearableTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  clearLabel?: string;
  wrapperClassName?: string;
}

export function ClearableInput({
  value,
  onChange,
  clearLabel = "Clear field",
  className,
  wrapperClassName,
  ...props
}: ClearableInputProps) {
  const hasValue = value.length > 0;

  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("w-full", hasValue ? "pr-10" : undefined, className)}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={clearLabel}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function ClearableTextarea({
  value,
  onChange,
  clearLabel = "Clear field",
  className,
  wrapperClassName,
  ...props
}: ClearableTextareaProps) {
  const hasValue = value.length > 0;

  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <textarea
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("w-full", hasValue ? "pr-10" : undefined, className)}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={clearLabel}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
