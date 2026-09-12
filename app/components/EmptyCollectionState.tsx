import type { ReactNode } from "react";
import {
  CollectionIllustration,
  type CollectionIllustrationKind,
} from "./CollectionIllustration";

type EmptyCollectionStateProps = {
  kind: CollectionIllustrationKind;
  title: string;
  description: string;
  action: ReactNode;
  className?: string;
  titleId?: string;
};

/** Shared empty-state hierarchy; each page supplies its own meaningful action. */
export function EmptyCollectionState({
  kind,
  title,
  description,
  action,
  className = "",
  titleId,
}: EmptyCollectionStateProps) {
  return (
    <div className={`empty-collection-state ${className}`}>
      <CollectionIllustration kind={kind} />
      <div className="empty-collection-copy">
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
