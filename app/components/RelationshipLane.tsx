import type { HTMLAttributes } from "react";

/** Supporting data on the other side of a relationship, shared across sheets. */
export function RelationshipLane({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`relationship-lane ${className}`}>
      {children}
    </div>
  );
}
