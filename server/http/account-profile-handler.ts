export type AccountIdentity = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
};

export type AccountProfileInput = {
  name: string;
  avatarUrl: string | null;
};

type AccountProfileResult =
  | { status: "ok"; account: AccountIdentity }
  | { status: "unauthenticated" }
  | { status: "error" };

export type LoadAccountProfile = () => Promise<AccountProfileResult>;
export type SaveAccountProfile = (
  input: AccountProfileInput,
) => Promise<AccountProfileResult>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readAccountInput(request: Request): Promise<AccountProfileInput | null> {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value)) return null;

    const name = typeof value.name === "string"
      ? value.name.trim().replace(/\s+/g, " ")
      : "";
    const avatarValue = typeof value.avatarUrl === "string"
      ? value.avatarUrl.trim()
      : "";

    if (name.length < 2 || name.length > 80) return null;
    if (avatarValue.length > 2048) return null;
    if (avatarValue) {
      let url: URL;
      try {
        url = new URL(avatarValue);
      } catch {
        return null;
      }
      if (url.protocol !== "https:") return null;
    }

    return { name, avatarUrl: avatarValue || null };
  } catch {
    return null;
  }
}

function accountResponse(result: AccountProfileResult) {
  if (result.status === "ok") {
    return Response.json({ data: { account: result.account } });
  }
  if (result.status === "unauthenticated") {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengelola akun." } },
      { status: 401 },
    );
  }
  return Response.json(
    { error: { code: "ACCOUNT_UNAVAILABLE", message: "Pengaturan akun belum dapat dimuat." } },
    { status: 502 },
  );
}

export function createAccountProfileHandlers(
  loadAccount: LoadAccountProfile,
  saveAccount: SaveAccountProfile,
) {
  return {
    async GET() {
      try {
        return accountResponse(await loadAccount());
      } catch {
        return accountResponse({ status: "error" });
      }
    },
    async PATCH(request: Request) {
      const input = await readAccountInput(request);
      if (!input) {
        return Response.json(
          {
            error: {
              code: "INVALID_ACCOUNT_PROFILE",
              message: "Nama perlu berisi 2–80 karakter dan foto harus berupa URL HTTPS.",
            },
          },
          { status: 400 },
        );
      }

      try {
        return accountResponse(await saveAccount(input));
      } catch {
        return accountResponse({ status: "error" });
      }
    },
  };
}
