"use client";

import { useId, useState } from "react";
import { useI18n } from "./LanguageProvider";

const sources = [
  "LinkedIn",
  "JobStreet",
  "Glints",
  "Kalibrr",
  "Indeed",
  "Karir.com",
  "Dealls",
  "Situs karier perusahaan",
  "Instagram",
  "Telegram",
  "WhatsApp",
];

export function JobSourceField({
  value = "",
  onChange,
  disabled = false,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const id = useId();
  const initial = value === "Belum diisi" ? "" : value;
  const [selection, setSelection] = useState(
    initial && !sources.includes(initial) ? "custom" : initial,
  );
  const [custom, setCustom] = useState(
    initial && !sources.includes(initial) ? initial : "",
  );

  return (
    <div className="job-source-field">
      <label htmlFor={id}>
        <span>{t("Sumber")}</span>
      </label>
      <select
        id={id}
        value={selection}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setSelection(next);
          onChange?.(next === "custom" ? custom : next);
        }}
      >
        <option value="">{t("Pilih sumber")}</option>
        {sources.map((source) => (
          <option key={source} value={source}>
            {t(source)}
          </option>
        ))}
        <option value="custom">{t("Lainnya — isi sendiri")}</option>
      </select>
      {selection === "custom" ? (
        <label className="job-source-custom">
          <span>{t("Nama sumber")}</span>
          <input
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value);
              onChange?.(event.target.value);
            }}
            placeholder={t("Tulis nama situs, media, atau referensi")}
            disabled={disabled}
          />
        </label>
      ) : null}
      {/* Keep the hidden field signature readable by the source contract. */}
      {/* prettier-ignore */}
      <input type="hidden" name="source"
        value={selection === "custom" ? custom : selection}
        disabled={disabled}
      />
    </div>
  );
}
