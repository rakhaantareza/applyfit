/** Templates for counts and announcements. Captures retain user-supplied text. */
export const messagePatterns: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /^(.*) persyaratan sudah terbukti · (.*) lainnya belum sepenuhnya terbukti$/,
    "$1 requirements are proven · $2 others are not fully proven yet",
  ],
  [/^(.*) persyaratan sudah terbukti$/, "$1 requirements are proven"],
  [/^(.*) persyaratan sudah terbukti\.$/, "$1 requirements are proven."],
  [/^(.*) bukti pendukung$/, "$1 supporting evidence"],
  [/^(.*) hasil ditemukan$/, "$1 results found"],
  [/^(.*) persyaratan$/, "$1 requirements"],
  [
    /^(.*) persyaratan masih perlu dicocokkan dengan profilmu\.$/,
    "$1 requirements still need to be matched with your profile.",
  ],
  [
    /^(.*) persyaratan belum cocok dengan profilmu$/,
    "$1 requirements do not match your profile yet",
  ],
  [
    /^(.*) dari (.*) persyaratan sudah didukung oleh skill dan pengalamanmu\.$/,
    "$1 of $2 requirements are supported by your skills and experience.",
  ],
  [
    /^(.*) lainnya sudah punya skill yang sesuai, tapi belum didukung portfolio atau pengalaman$/,
    "$1 others have matching skills but no supporting portfolio or experience",
  ],
  [
    /^(.*) lainnya terhubung ke skill yang masih kamu pelajari$/,
    "$1 others link to skills you are still learning",
  ],
  [
    /^(.*) persyaratan wajib dan (.*) persyaratan preferensi belum punya skill yang sesuai di profilmu$/,
    "$1 required and $2 preferred requirements have no matching profile skills yet",
  ],
  [
    /^(.*) persyaratan wajib belum punya skill yang sesuai di profilmu$/,
    "$1 required requirements have no matching profile skills yet",
  ],
  [
    /^(.*) persyaratan preferensi belum punya skill yang sesuai di profilmu$/,
    "$1 preferred requirements have no matching profile skills yet",
  ],
  [
    /^Dibuktikan oleh (.*) bukti terhubung$/,
    "Supported by $1 linked evidence items",
  ],
  [/^(.*) berhasil diperbarui\.$/, "$1 updated."],
  [/^(.*) berhasil ditambahkan\.$/, "$1 added."],
  [/^(.*) berhasil dihapus\.$/, "$1 deleted."],
  [
    /^(.*) berhasil dihubungkan ke requirement\.$/,
    "$1 linked to the requirement.",
  ],
  [/^(.*) requirement berhasil diekstrak\.$/, "$1 requirements extracted."],
  [
    /^(.*) bukti di profil akan mendukung hubungan ini\.$/,
    "$1 evidence items in your profile will support this link.",
  ],
  [
    /^Nama (.*) cocok langsung dengan requirement\.$/,
    "$1 directly matches the requirement.",
  ],
  [/^Diperbarui (.*)$/, "Updated $1"],
  [/^Tahap saat ini: (.*)$/, "Current step: $1"],
  [/^Fit Score (.*) persen$/, "Fit Score $1 percent"],
  [/^Skor kecocokan (.*) persen$/, "Fit Score $1 percent"],
  [/^Kecocokan profil (.*) persen$/, "Profile match $1 percent"],
  [/^Tindakan untuk (.*)$/, "Actions for $1"],
  [/^Skill untuk (.*)$/, "Skills for $1"],
  [/^Foto profil (.*)$/, "Profile photo for $1"],
  [/^Hubungan profil untuk (.*)$/, "Profile connections for $1"],
  [/^Hapus kolom requirement (.*)$/, "Delete requirement field $1"],
  [/^Hapus requirement: (.*)$/, "Delete requirement: $1"],
  [/^Edit requirement: (.*)$/, "Edit requirement: $1"],
  [/^Pisahkan requirement: (.*)$/, "Split requirement: $1"],
  [/^Prioritas requirement: (.*)$/, "Requirement priority: $1"],
  [/^Hapus (.*)$/, "Delete $1"],
  [/^Buka menu akun (.*)$/, "Open account menu for $1"],
  [/^Tutup menu akun (.*)$/, "Close account menu for $1"],
  [/^Open menu akun (.*)$/, "Open account menu for $1"],
  [/^Close menu akun (.*)$/, "Close account menu for $1"],
  [
    /^(.*) dikali (.*) persen sama dengan (.*)$/,
    "$1 times $2 percent equals $3",
  ],
];
