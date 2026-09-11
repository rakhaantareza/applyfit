/** Four meeting shapes: requirement, skill, evidence, and their shared fit. */
export function BrandMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-motif ${className}`}
      viewBox="-8 18 174 116"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20 20h52v52H20a26 26 0 0 1 0-52Z"
        fill="currentColor"
        opacity=".18"
      />
      <path
        d="M80 20h26a26 26 0 0 1 26 26v26H80V20Z"
        fill="currentColor"
        opacity=".5"
      />
      <path
        d="M20 80h52v52H46a26 26 0 0 1-26-26V80Z"
        fill="currentColor"
        opacity=".75"
      />
      <path d="M80 80h52v26a26 26 0 0 1-26 26H80V80Z" fill="currentColor" />
      <circle cx="154" cy="98" r="10" fill="var(--accent)" />
    </svg>
  );
}
