import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/format";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-ui font-semibold text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cx("input-luxe", error && "border-red-400", className)}
          {...rest}
        />
        {hint && !error && (
          <p className="mt-1 text-xs text-ink-muted">{hint}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
