export type CollectionIllustrationKind =
  | "jobs"
  | "portfolio"
  | "search"
  | "profile"
  | "skills"
  | "requirements"
  | "matching"
  | "analysis";

/** Original paper-and-ink illustrations for empty collections and searches. */
export function CollectionIllustration({
  kind,
}: {
  kind: CollectionIllustrationKind;
}) {
  return (
    <svg
      className="collection-illustration"
      viewBox="0 0 240 180"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="158" rx="88" ry="9" fill="#24262c" opacity=".06" />
      <circle cx="122" cy="88" r="68" fill="#e9ecfc" />
      <path
        d="M35 80h14M42 73v14M190 42h12M196 36v12"
        stroke="#adb8ef"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="199" cy="122" r="5" fill="#ddd3a8" />
      {kind === "jobs" ? (
        <>
          <path
            d="M62 94 82 68h79l20 26v54H62V94Z"
            fill="#c5ccf4"
            stroke="#4056d8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect
            x="86"
            y="32"
            width="74"
            height="94"
            rx="7"
            transform="rotate(8 86 32)"
            fill="#fffefa"
            stroke="#4056d8"
            strokeWidth="2"
          />
          <rect
            x="100"
            y="51"
            width="19"
            height="19"
            rx="5"
            transform="rotate(8 100 51)"
            fill="#ddd3a8"
          />
          <path
            d="m99 82 43 6m-45 6 32 5"
            stroke="#adb8ef"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M62 96h37l8 15h29l8-15h37v45a7 7 0 0 1-7 7H69a7 7 0 0 1-7-7V96Z"
            fill="#4056d8"
          />
          <path
            d="M108 130h27"
            stroke="#fffefa"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : kind === "portfolio" || kind === "search" ? (
        <>
          <path
            d="M57 66a8 8 0 0 1 8-8h34l12 13h62a8 8 0 0 1 8 8v62H57V66Z"
            fill="#c5ccf4"
            stroke="#4056d8"
            strokeWidth="2"
          />
          <rect
            x="81"
            y="39"
            width="79"
            height="91"
            rx="7"
            transform="rotate(-8 81 39)"
            fill="#fffefa"
            stroke="#4056d8"
            strokeWidth="2"
          />
          <path
            d="m98 64 15-2m-13 16 39-6m-37 19 28-4"
            stroke="#adb8ef"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M50 96a8 8 0 0 1 8-9h48l12 12h65a8 8 0 0 1 8 9l-7 33a9 9 0 0 1-9 7H67a9 9 0 0 1-9-7l-8-45Z"
            fill="#4056d8"
          />
          <path
            d="M78 125h23"
            stroke="#fffefa"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {kind === "search" ? (
            <g stroke="#24262c" strokeWidth="3">
              <circle cx="169" cy="111" r="20" fill="#fffefa" />
              <path d="m184 127 17 18" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="rotate(12 169 62)">
              <rect
                x="150"
                y="43"
                width="38"
                height="38"
                rx="10"
                fill="#ddd3a8"
              />
              <path
                d="m160 62 6 6 12-13"
                stroke="#4056d8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </>
      ) : (
        <ReadinessArtwork kind={kind} />
      )}
    </svg>
  );
}

/** Decorative artwork: the surrounding heading describes the actual state. */
function ReadinessArtwork({
  kind,
}: {
  kind: Exclude<CollectionIllustrationKind, "jobs" | "portfolio" | "search">;
}) {
  if (kind === "matching") {
    return (
      <g stroke="#4056d8" strokeWidth="2" strokeLinejoin="round">
        <path d="M91 85h58" strokeDasharray="5 5" />
        <rect x="49" y="48" width="65" height="91" rx="9" fill="#fffefa" />
        <rect x="137" y="62" width="58" height="77" rx="9" fill="#c5ccf4" />
        <circle cx="81" cy="77" r="12" fill="#ddd3a8" stroke="none" />
        <path
          d="M64 106h33m-33 12h22M153 97h26m-26 13h18"
          stroke="#adb8ef"
          strokeLinecap="round"
        />
        <circle cx="126" cy="94" r="16" fill="#4056d8" />
        <path
          d="m121 95-2 2a4 4 0 0 0 6 6l3-3m1-7 2-2a4 4 0 0 0-6-6l-3 3m1 7 6-6"
          stroke="#fffefa"
          strokeLinecap="round"
        />
      </g>
    );
  }
  return (
    <>
      <rect
        x="65"
        y="43"
        width="106"
        height="111"
        rx="10"
        transform="rotate(-7 65 43)"
        fill="#c5ccf4"
        stroke="#4056d8"
        strokeWidth="2"
      />
      <rect
        x="77"
        y="34"
        width="106"
        height="112"
        rx="10"
        fill="#fffefa"
        stroke="#4056d8"
        strokeWidth="2"
      />
      {kind === "profile" ? (
        <>
          <circle cx="111" cy="70" r="14" fill="#ddd3a8" />
          <path d="M90 104c0-23 42-23 42 0" fill="#4056d8" />
          <path
            d="M144 66h22m-22 14h16M95 124h66"
            stroke="#adb8ef"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : kind === "skills" ? (
        <>
          <rect x="94" y="51" width="31" height="31" rx="7" fill="#4056d8" />
          <rect x="135" y="51" width="31" height="31" rx="7" fill="#c5ccf4" />
          <rect x="94" y="92" width="31" height="31" rx="7" fill="#c5ccf4" />
          <rect x="135" y="92" width="31" height="31" rx="7" fill="#ddd3a8" />
          <path
            d="m109 57 7 9-7 9-7-9 7-9"
            stroke="#fffefa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M145 108h12m-6-6v12"
            stroke="#4056d8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : kind === "requirements" ? (
        <>
          <rect x="96" y="51" width="42" height="9" rx="4" fill="#4056d8" />
          {[80, 101, 122].map((y) => (
            <g key={y}>
              <rect
                x="96"
                y={y - 5}
                width="10"
                height="10"
                rx="3"
                fill="#ddd3a8"
              />
              <path
                d={"M116 " + y + "h46"}
                stroke="#adb8ef"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          ))}
        </>
      ) : (
        <>
          <path
            d="M96 56h51"
            stroke="#adb8ef"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="98" y="99" width="15" height="25" rx="4" fill="#c5ccf4" />
          <rect x="121" y="84" width="15" height="40" rx="4" fill="#ddd3a8" />
          <rect x="144" y="70" width="15" height="54" rx="4" fill="#4056d8" />
        </>
      )}
    </>
  );
}
