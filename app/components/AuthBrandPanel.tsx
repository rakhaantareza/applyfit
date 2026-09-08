import { Check } from "lucide-react";
import { StableLink as Link } from "./StableLink";

const readinessFlow = [
  "Hubungkan skill dengan pengalaman yang mendukungnya",
  "Lihat persyaratan yang sudah dan belum cocok",
  "Pahami alasan di balik Fit Score",
];

type AuthBrandPanelProps = {
  titleId: string;
};

export function AuthBrandPanel({ titleId }: AuthBrandPanelProps) {
  return (
    <section className="auth-brand-panel" aria-labelledby={titleId}>
      <Link className="auth-brand" href="/" aria-label="ApplyFit beranda">
        <span className="brand-mark" aria-hidden="true">A</span>
        <span className="auth-wordmark">ApplyFit</span>
        <span className="auth-beta" aria-label="Versi Beta">
          <span aria-hidden="true">·</span> Beta
        </span>
      </Link>

      <div className="auth-brand-copy">
        <h1 id={titleId}>Cek kesiapanmu sebelum melamar.</h1>
        <p>
          Bandingkan persyaratan lowongan dengan skill dan pengalaman yang sudah
          kamu punya.
        </p>

        <ul className="auth-benefits" aria-label="Manfaat utama ApplyFit">
          {readinessFlow.map((item) => (
            <li key={item}>
              <span aria-hidden="true"><Check size={14} strokeWidth={2.1} /></span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="auth-brand-footnote">
        Fit Score membantu kamu melihat kecocokan, bukan menentukan apakah kamu
        harus melamar.
      </p>
    </section>
  );
}
