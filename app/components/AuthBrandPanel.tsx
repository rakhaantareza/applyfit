"use client";
import { useI18n } from "./LanguageProvider";

import { ConnectionPath } from "./ConnectionPath";
import { LanguagePicker } from "./LanguagePicker";
import { BrandMotif } from "./BrandMotif";
import { StableLink as Link } from "./StableLink";

type AuthBrandPanelProps = {
  titleId: string;
};

export function AuthBrandPanel({ titleId }: AuthBrandPanelProps) {
  const { t } = useI18n();
  return (
    <section className="auth-brand-panel" aria-labelledby={titleId}>
      <div className="auth-language">
        <LanguagePicker />
      </div>
      <BrandMotif />
      <Link className="auth-brand" href="/" aria-label={t("ApplyFit beranda")}>
        <BrandMotif className="brand-logo" />
        <span className="auth-wordmark">ApplyFit</span>
        <span className="auth-beta" aria-label={t("Versi Beta")}>
          <span aria-hidden="true">·</span> Beta
        </span>
      </Link>

      <div className="auth-brand-copy">
        <h1 id={titleId}>{t("Cek kesiapanmu sebelum melamar.")}</h1>
        <p>
          {t(
            "Bandingkan persyaratan lowongan dengan skill dan pengalaman yang sudah kamu punya.",
          )}
        </p>

        <ConnectionPath
          className="auth-connection-path"
          label={t("Dasar analisis ApplyFit")}
          steps={[
            "Persyaratan lowongan",
            "Skillmu",
            "Portfolio & Pengalaman",
            "Fit Analysis",
          ]}
        />
      </div>

      <p className="auth-brand-footnote">
        {t(
          "Fit Score membantu kamu melihat kecocokan, bukan menentukan apakah kamu harus melamar.",
        )}
      </p>
    </section>
  );
}
