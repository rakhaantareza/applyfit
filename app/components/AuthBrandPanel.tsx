import { Check, ShieldCheck } from "lucide-react";
import { StableLink as Link } from "./StableLink";

const readinessFlow = [
  "Susun skill dan bukti dalam satu profil",
  "Periksa Persyaratan lowongan secara transparan",
  "Pahami dasar setiap poin Fit Score",
];

type AuthBrandPanelProps = {
  titleId: string;
  title: string;
  description: string;
};

export function AuthBrandPanel({
  titleId,
  title,
  description,
}: AuthBrandPanelProps) {
  return (
    <section className="auth-brand-panel" aria-labelledby={titleId}>
      <Link className="auth-brand" href="/" aria-label="ApplyFit beranda">
        <span className="brand-mark" aria-hidden="true">A</span>
        <span>ApplyFit</span>
      </Link>

      <div className="auth-brand-copy">
        <p className="auth-kicker">
          <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.9} />
          Career readiness berbasis bukti
        </p>
        <h1 id={titleId}>{title}</h1>
        <p>{description}</p>

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
        Fit Score menjelaskan kondisi profilmu—bukan memutuskan apakah kamu harus melamar.
      </p>
    </section>
  );
}
