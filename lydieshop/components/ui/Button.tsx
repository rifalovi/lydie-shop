import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className, children, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      className={cx(variantClass[variant], sizeClass[size], className)}
      {...rest}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
