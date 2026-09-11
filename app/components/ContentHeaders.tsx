"use client";
import { useI18n } from "./LanguageProvider";

import type { ReactNode } from "react";

type ContentHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  titleId?: string;
  className?: string;
};

function joinClassNames(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

export function PageHeader({
  title,
  description,
  action,
  titleId,
  className,
}: ContentHeaderProps) {
  const { t } = useI18n();
  return (
    <header className={joinClassNames("page-header", className)}>
      <div className="page-header-copy">
        <h1 className="type-page-title" id={titleId}>
          {title}
        </h1>
        {description ? (
          <p className="page-header-description type-helper">
            {t(description)}
          </p>
        ) : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  titleId,
  className,
}: ContentHeaderProps) {
  const { t } = useI18n();
  return (
    <header className={joinClassNames("section-header", className)}>
      <div className="section-header-copy">
        <h2 className="type-section-title" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="section-header-description type-helper">
            {t(description)}
          </p>
        ) : null}
      </div>
      {action ? <div className="section-header-action">{action}</div> : null}
    </header>
  );
}
