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
          <h3>Belum ada persyaratan Skill atau Tool</h3>
          <p>
            Persyaratan Education dan Experience tetap tersimpan sebagai konteks, tetapi
            Fit Score baru dapat dihitung setelah ada syarat berbasis Skill atau Tool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="requirement-filters" aria-label="Filter persyaratan">
        <div className="filter-fields">
          <label>
            <select
              aria-label="Filter status persyaratan"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option>Semua status</option>
              <option value="Proven">Terbukti</option>
              <option value="Partial">Belum terbukti</option>
              <option value="Learning">Sedang dipelajari</option>
              <option value="Missing">Belum ada kecocokan</option>
            </select>
          </label>
          <label>
            <select
              aria-label="Filter prioritas persyaratan"
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
            {filteredRequirements.length} dari {requirements.length} persyaratan
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
          <RequirementDetail requirement={requirement} key={`${requirement.name}-${requirement.priority}`} />
        ))}

        {filteredRequirements.length === 0 && (
          <div className="empty-filter-state">
            <span aria-hidden="true">⌕</span>
            <h3>Tidak ada persyaratan yang cocok</h3>
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
