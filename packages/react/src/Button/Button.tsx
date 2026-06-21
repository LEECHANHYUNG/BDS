import type { ButtonHTMLAttributes } from "react";
import { button } from "./Button.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: "primary";
}

export function Button({ className, intent = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={[button, className].filter(Boolean).join(" ")}
      data-intent={intent}
      {...props}
    />
  );
}
