"use client";
import { useI18n } from "./LanguageProvider";

import { RelationshipLane } from "./RelationshipLane";
import { ChevronDown } from "lucide-react";
import type { Requirement, RequirementStatus } from "../types/fit-analysis";
import { requirementStatusLabels } from "../lib/fit-status-labels";

type RequirementDetailProps = {
  requirement: Requirement;
};

const statusPresentation: Record<
  RequirementStatus,
  { className: string; icon: string; label: string; description: string }
> = {
  Proven: {
    className: "proven",
    icon: "✓",
    label: requirementStatusLabels.Proven,
    description: "Skill aktif dan memiliki bukti pendukung",
  },
  Partial: {
    className: "partial",
    icon: "•",
    label: requirementStatusLabels.Partial,
    description: "Skill aktif tetapi belum memiliki bukti pendukung",
  },
  Learning: {
    className: "learning",
    icon: "•",
    label: requirementStatusLabels.Learning,
    description: "Skill sedang dipelajari",
  },
  Missing: {
    className: "missing",
    icon: "!",
    label: requirementStatusLabels.Missing,
    description: "Belum ada skill profil yang cocok",
  },
};

function formatPoint(value: number, language = "id") {
  return new Intl.NumberFormat(language === "en" ? "en-GB" : "id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function RequirementDetail({ requirement }: RequirementDetailProps) {
  const { t, language } = useI18n();
  const presentation = statusPresentation[requirement.status];
  const isNonSkill = requirement.score === null;
  const canExpand = !isNonSkill && requirement.status !== "Missing";
  const evidenceCount = requirement.evidence.length;
  const skillNames = requirement.skills.map((skill) => skill.name).join(", ");
  const metadata = isNonSkill
    ? [t(requirement.kind), t(requirement.priority), t("Di luar Fit Score")]
    : skillNames
      ? [
          skillNames,
          t(requirement.priority),
          evidenceCount > 0 ? t(`${evidenceCount} bukti pendukung`) : null,
        ]
      : [];
  const metadataCopy = metadata
    .filter((item): item is string => Boolean(item))
    .join(" · ");

  const summaryContent = (
    <>
      <span
        className={`requirement-icon ${presentation.className}`}
        aria-label={t(presentation.description)}
        role="img"
      >
        {presentation.icon}
      </span>
      <span className="requirement-collapsed-copy">
        <strong className="requirement-name">{requirement.name}</strong>
        {metadataCopy ? (
          <span className="requirement-meta">{metadataCopy}</span>
        ) : (
          <span className="requirement-meta">
            {t("Belum ada skill yang cocok.")}
          </span>
        )}
      </span>
      <span className="requirement-summary-status">
        <span className={`status-badge ${presentation.className}`}>
          {t(presentation.label)}
        </span>
        {canExpand ? (
          <ChevronDown
            className="requirement-chevron"
            aria-hidden="true"
            size={17}
            strokeWidth={1.8}
          />
        ) : null}
      </span>
    </>
  );

  if (!canExpand) {
    return (
      <article className="requirement-row static">{summaryContent}</article>
    );
  }

  return (
    <details className="requirement-row expandable">
      <summary className="requirement-summary">{summaryContent}</summary>
      <RelationshipLane className="requirement-expanded">
        <div className="requirement-detail-group">
          <span className="requirement-detail-label">
            {t("Skill terhubung")}
          </span>
          <div className="linked-skill-list">
            {requirement.skills.map((skill) => (
              <span key={skill.name}>
                <strong>{skill.name}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="requirement-detail-group requirement-evidence-group">
          <span className="requirement-detail-label">
            {t("Portfolio & Pengalaman")}
          </span>
          {evidenceCount ? (
            <ul
              className="supporting-evidence-list"
              aria-label={t("Bukti pendukung")}
            >
              {requirement.evidence.map((evidence) => (
                <li key={`${evidence.type}-${evidence.title}`}>
                  <span>{t(evidence.type)}</span>
                  <strong>{evidence.title}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("Belum ada bukti pendukung untuk skill ini.")}</p>
          )}
        </div>

        {requirement.score ? (
          <div className="requirement-detail-group score-contribution">
            <span className="requirement-detail-label">
              {t("Kontribusi ke Fit Score")}
            </span>
            <strong>
              {formatPoint(requirement.score.earned, language)}
              {" / "}
              {formatPoint(requirement.score.maximum, language)} {t("poin")}
            </strong>
            <small>
              {requirement.score.weight} × {requirement.score.multiplier}%
            </small>
          </div>
        ) : null}
      </RelationshipLane>
    </details>
  );
}
