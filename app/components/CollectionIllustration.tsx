/** Original paper-and-ink illustrations for empty collections and searches. */
export function CollectionIllustration({
  kind,
}: {
  kind: "jobs" | "portfolio" | "search";
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
      ) : (
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
      )}
    </svg>
  );
}
