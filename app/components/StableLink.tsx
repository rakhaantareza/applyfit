import NextLink from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type StableLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
};

/** Keeps shared internal links on the client router so the root session survives. */
export function StableLink({ children, href, ...props }: StableLinkProps) {
  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  );
}
