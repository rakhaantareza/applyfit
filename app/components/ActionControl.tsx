import { ArrowRight } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
} from "react";
import { StableLink } from "./StableLink";

export type ActionVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "destructive-ghost";
export type ActionSize = "compact" | "default" | "auth";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ActionSize;
  variant?: ActionVariant;
};

type ActionLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  size?: ActionSize;
  variant?: ActionVariant | "text";
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "compact" | "default";
  tone?: "neutral" | "destructive";
};

export function ActionButton({
  className,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ActionButtonProps) {
  return (
    <button
      {...props}
      className={actionClassName(variant, size, className)}
      type={type}
    />
  );
}

export function ActionLink({
  className,
  href,
  size = "default",
  variant = "primary",
  ...props
}: ActionLinkProps) {
  return (
    <StableLink
      {...props}
      className={actionClassName(variant, size, className)}
      href={href}
    />
  );
}

export function IconButton({
  className,
  size = "default",
  tone = "neutral",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      className={[
        "ui-icon-button",
        `ui-icon-button--${size}`,
        `ui-icon-button--${tone}`,
        className,
      ].filter(Boolean).join(" ")}
      type={type}
    />
  );
}

export function CtaArrow({ className }: { className?: string }) {
  return (
    <ArrowRight
      className={["cta-arrow", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      size={16}
      strokeWidth={1.8}
    />
  );
}

function actionClassName(
  variant: ActionVariant | "text",
  size: ActionSize,
  className?: string,
) {
  return [
    variant === "text" ? "ui-text-cta" : "ui-button",
    variant === "text" ? "" : `ui-button--${variant}`,
    variant === "text" ? "" : `ui-button--${size}`,
    className,
  ].filter(Boolean).join(" ");
}
