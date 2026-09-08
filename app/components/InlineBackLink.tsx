import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { StableLink } from "./StableLink";

export function InlineBackLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <StableLink className="inline-back-link" href={href}>
      <ArrowLeft
        className="inline-back-link-arrow"
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
      />
      <span>{children}</span>
    </StableLink>
  );
}
