"use client";
import { useI18n } from "./LanguageProvider";

import { useMemo, useState } from "react";
import { RequirementDetail } from "./RequirementDetail";
import type { Requirement, RequirementStatus } from "../types/fit-analysis";

export type { Requirement } from "../types/fit-analysis";

type RequirementListProps = {
  requirements: Requirement[];
};

type StatusFilter = "Semua status" | RequirementStatus;
type PriorityFilter = "Semua prioritas" | Requirement["priority"];

export function RequirementList({ requirements }: RequirementListProps) {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("Semua status");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("Semua prioritas");

  const filteredRequirements = useMemo(
    () =>
      requirements.filter((requirement) => {
        const matchesStatus =
          statusFilter === "Semua status" ||
          requirement.status === statusFilter;
        const matchesPriority =
          priorityFilter === "Semua prioritas" ||
          requirement.priority === priorityFilter;

        return matchesStatus && matchesPriority;
      }),
    [priorityFilter, requirements, statusFilter],
  );

  const scorableRequirementCount = useMemo(
    () =>
      requirements.filter(
        (requirement) =>
          requirement.kind === "Skill" || requirement.kind === "Tool",
      ).length,
    [requirements],
  );

  const hasActiveFilter =
    statusFilter !== "Semua status" || priorityFilter !== "Semua prioritas";

  function resetFilters() {
    setStatusFilter("Semua status");
    setPriorityFilter("Semua prioritas");
  }

  if (scorableRequirementCount === 0) {
    return (
      <div className="empty-scope-state" role="status">
        <span className="empty-scope-icon" aria-hidden="true">
          ◌
        </span>
        <div>
          <p className="eyebrow">{t("Skor belum tersedia")}</p>
          <h3>{t("Belum ada persyaratan Skill atau Tool")}</h3>
          <p>
            {t(
              "Persyaratan Education dan Experience tetap tersimpan sebagai konteks, tetapi Fit Score baru dapat dihitung setelah ada syarat berbasis Skill atau Tool.",
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="requirement-filters" aria-label={t("Filter persyaratan")}>
        <div className="filter-fields">
          <label>
            <select
              aria-label={t("Filter status persyaratan")}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value={"Semua status"}>{t("Semua status")}</option>
              <option value="Proven">{t("Terbukti")}</option>
              <option value="Partial">{t("Belum terbukti")}</option>
              <option value="Learning">{t("Sedang dipelajari")}</option>
              <option value="Missing">{t("Belum ada kecocokan")}</option>
            </select>
          </label>
          <label>
            <select
              aria-label={t("Filter prioritas persyaratan")}
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as PriorityFilter)
              }
            >
              <option value={"Semua prioritas"}>{t("Semua prioritas")}</option>
              <option value={"Wajib"}>{t("Wajib")}</option>
              <option value={"Preferensi"}>{t("Preferensi")}</option>
            </select>
          </label>
        </div>
        <div className="filter-result">
          <span aria-live="polite">
            {filteredRequirements.length} {t("dari")} {requirements.length}{" "}
            {t("persyaratan")}
          </span>
          {hasActiveFilter && (
            <button type="button" onClick={resetFilters}>
              {t("Reset filter")}
            </button>
          )}
        </div>
      </div>

      <div className="requirements-list">
        {[...filteredRequirements]
          .sort(
            (a, b) =>
              Number(a.status === "Missing") - Number(b.status === "Missing"),
          )
          .map((requirement) => (
            <RequirementDetail
              requirement={requirement}
              key={`${requirement.name}-${requirement.priority}`}
            />
          ))}

        {filteredRequirements.length === 0 && (
          <div className="empty-filter-state">
            <span aria-hidden="true">⌕</span>
            <h3>{t("Tidak ada persyaratan yang cocok")}</h3>
            <p>{t("Coba ubah status atau prioritas yang dipilih.")}</p>
            <button type="button" onClick={resetFilters}>
              {t("Tampilkan semua")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
