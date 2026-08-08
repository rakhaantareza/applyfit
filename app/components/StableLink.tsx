import type { ComponentPropsWithoutRef } from "react";

type StableLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
};

/**
 * Uses a document navigation while Vinext's production client router is unstable.
 * This keeps internal routes consistent between local development and Sites.
 */
export function StableLink({ children, href, ...props }: StableLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
