"use client";
import { useI18n } from "../../components/LanguageProvider";

import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  ActionButton,
  ActionLink,
  CtaArrow,
} from "../../components/ActionControl";

import { JobSourceField } from "../../components/JobSourceField";

type FormStatus = "idle" | "submitting" | "success";

export function JobCreationForm() {
  const { t } = useI18n();

  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const isBusy = status !== "idle";
  const wordCount = description.trim()
    ? description.trim().split(/\s+/).length
    : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const company = String(form.get("company") ?? "").trim();
    const rawDescription = description.trim();
    if (!title || !company || !rawDescription) {
      setError("Role, perusahaan, dan deskripsi lowongan perlu diisi.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company,
          source: nullableFormValue(form, "source"),
          sourceUrl: null,
          location: nullableFormValue(form, "location"),
          workArrangement: nullableFormValue(form, "workArrangement"),
          rawDescription,
        }),
      });
      const result = await readCreateJobResponse(response);
      const createdJobId = result.data?.job?.id;
      if (!response.ok || !createdJobId) {
        const fallback =
          response.status === 401
            ? "Sesi akun belum aktif. Masuk kembali lalu coba lagi."
            : "Lowongan belum dapat disimpan. Coba lagi.";
        throw new Error(result.error?.message ?? fallback);
      }

      setStatus("success");
      window.setTimeout(() => {
        window.location.assign(
          `/lowongan/${encodeURIComponent(createdJobId)}?baru=1`,
        );
      }, 650);
    } catch (requestError) {
      setStatus("idle");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Lowongan belum dapat disimpan. Coba lagi.",
      );
    }
  }

  return (
    <section className="new-job-form-card" aria-labelledby="new-job-form-title">
      <div className="new-job-form-heading">
        <span aria-hidden="true">
          <BriefcaseBusiness size={20} strokeWidth={1.8} />
        </span>
        <div>
          <h2 id="new-job-form-title">{t("Informasi lowongan")}</h2>
          <p>
            {t("Gunakan informasi sebagaimana tertulis di sumber lowongan.")}
          </p>
        </div>
      </div>

      <form className="new-job-form" onSubmit={handleSubmit} noValidate>
        <div className="new-job-form-grid">
          <label>
            <span>
              Role <small>{t("Wajib")}</small>
            </span>
            <input
              name="title"
              type="text"
              autoComplete="organization-title"
              placeholder={t("Contoh: Frontend Developer")}
              disabled={isBusy}
              required
            />
          </label>
          <label>
            <span>
              {t("Perusahaan")} <small>{t("Wajib")}</small>
            </span>
            <input
              name="company"
              type="text"
              autoComplete="organization"
              placeholder={t("Nama perusahaan")}
              disabled={isBusy}
              required
            />
          </label>
          <JobSourceField disabled={isBusy} />
          <label>
            <span>{t("Lokasi")}</span>
            <input
              name="location"
              type="text"
              autoComplete="address-level2"
              placeholder={t("Kota atau area kerja")}
              disabled={isBusy}
            />
          </label>
          <label className="new-job-arrangement-field">
            <span>{t("Cara kerja")}</span>
            <select name="workArrangement" defaultValue="" disabled={isBusy}>
              <option value="">{t("Belum disebutkan")}</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </label>
        </div>

        <label className="new-job-description-field">
          <span>
            {t("Deskripsi lowongan")} <small>{t("Wajib")}</small>
          </span>
          <small>
            {t(
              "Tempel deskripsi lengkap agar requirement dapat diekstrak dengan konteks yang cukup.",
            )}
          </small>
          <textarea
            name="rawDescription"
            rows={13}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t(
              "Tempel deskripsi pekerjaan, tanggung jawab, dan kualifikasi di sini…",
            )}
            disabled={isBusy}
            required
          />
          <span className="new-job-word-count">
            {wordCount} {t("kata")}
          </span>
        </label>

        {t(error) ? (
          <p className="new-job-form-message error" role="alert">
            <AlertCircle aria-hidden="true" size={16} />
            {t(error)}
          </p>
        ) : null}
        {status === "success" ? (
          <p className="new-job-form-message success" role="status">
            <CheckCircle2 aria-hidden="true" size={16} />
            {t("Lowongan tersimpan. Membuka langkah ekstraksi requirement…")}
          </p>
        ) : null}

        <div className="new-job-form-actions">
          <ActionLink
            className="career-button secondary"
            variant="secondary"
            href="/lowongan"
            aria-disabled={isBusy}
          >
            {t("Batal")}
          </ActionLink>
          <ActionButton
            className="career-button primary"
            type="submit"
            disabled={isBusy}
          >
            {status === "submitting"
              ? t("Menyimpan…")
              : status === "success"
                ? t("Tersimpan")
                : t("Simpan dan lanjutkan")}
            {status === "submitting" ? (
              <LoaderCircle className="spin" aria-hidden="true" size={16} />
            ) : (
              <CtaArrow />
            )}
          </ActionButton>
        </div>
      </form>
    </section>
  );
}

function nullableFormValue(form: FormData, field: string) {
  const value = String(form.get(field) ?? "").trim();
  return value || null;
}

type CreateJobResponse = {
  data?: { job?: { id?: string } };
  error?: { message?: string };
};

async function readCreateJobResponse(
  response: Response,
): Promise<CreateJobResponse> {
  try {
    return (await response.json()) as CreateJobResponse;
  } catch {
    return {};
  }
}
