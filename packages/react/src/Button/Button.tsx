import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { button } from "./Button.css";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  intent?: "danger" | "neutral" | "primary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent = "primary", ...props }, ref) => {
    const buttonClassName = button({ intent });

    return (
      <button
        ref={ref}
        className={[buttonClassName, className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
