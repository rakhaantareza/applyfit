"use client";

import { useMemo, useState } from "react";
import { RequirementDetail } from "./RequirementDetail";
import type {
  Requirement,
  RequirementStatus,
} from "../types/fit-analysis";

export type { Requirement } from "../types/fit-analysis";

type RequirementListProps = {
  requirements: Requirement[];
};

type StatusFilter = "Semua status" | RequirementStatus;
type PriorityFilter = "Semua prioritas" | Requirement["priority"];

export function RequirementList({ requirements }: RequirementListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua status");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("Semua prioritas");

  const filteredRequirements = useMemo(
    () =>
      requirements.filter((requirement) => {
        const matchesStatus =
          statusFilter === "Semua status" || requirement.status === statusFilter;
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
        (requirement) => requirement.kind === "Skill" || requirement.kind === "Tool",
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
          <p className="eyebrow">Skor belum tersedia</p>
          <h3>Belum ada requirement Skill atau Tool</h3>
          <p>
            Requirement Education dan Experience tetap tersimpan untuk referensi, tetapi
            Fit Score baru dapat dihitung setelah ada syarat berbasis Skill atau Tool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="requirement-filters" aria-label="Filter requirement">
        <div className="filter-fields">
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option>Semua status</option>
              <option>Proven</option>
              <option>Partial</option>
              <option>Learning</option>
              <option>Missing</option>
            </select>
          </label>
          <label>
            <span>Prioritas</span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as PriorityFilter)
              }
            >
              <option>Semua prioritas</option>
              <option>Wajib</option>
              <option>Preferensi</option>
            </select>
          </label>
        </div>
        <div className="filter-result">
          <span aria-live="polite">
            {filteredRequirements.length} dari {requirements.length} requirement
          </span>
          {hasActiveFilter && (
            <button type="button" onClick={resetFilters}>
              Reset filter
            </button>
          )}
        </div>
      </div>

      <div className="requirements-list">
        {filteredRequirements.map((requirement) => (
          <RequirementDetail requirement={requirement} key={requirement.name} />
        ))}

        {filteredRequirements.length === 0 && (
          <div className="empty-filter-state">
            <span aria-hidden="true">⌕</span>
            <h3>Tidak ada requirement yang cocok</h3>
            <p>Coba ubah status atau prioritas yang dipilih.</p>
            <button type="button" onClick={resetFilters}>
              Tampilkan semua
            </button>
          </div>
        )}
      </div>
    </>
  );
}
