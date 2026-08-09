import { createInsForgeServerClient } from "../../../lib/insforge/server.ts";
import {
  createAccountProfileHandlers,
  type AccountIdentity,
  type AccountProfileInput,
} from "../../../../server/http/account-profile-handler.ts";

function toAccount(user: {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: { name?: string; avatar_url?: string } | null;
}): AccountIdentity {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.profile?.name?.trim() || user.email.split("@")[0] || "Pengguna ApplyFit",
    avatarUrl: user.profile?.avatar_url?.trim() || null,
  };
}

async function currentUser() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) return { status: "error" as const };
  if (!data.user) return { status: "unauthenticated" as const };
  return { status: "ok" as const, client, user: data.user };
}

async function loadAccount() {
  const context = await currentUser();
  if (context.status !== "ok") return context;
  return { status: "ok" as const, account: toAccount(context.user) };
}

async function saveAccount(input: AccountProfileInput) {
  const context = await currentUser();
  if (context.status !== "ok") return context;

  const currentProfile = context.user.profile ?? {};
  const { data, error } = await context.client.auth.setProfile({
    ...currentProfile,
    name: input.name,
    avatar_url: input.avatarUrl ?? "",
  });
  if (error || !data?.profile) return { status: "error" as const };

  return {
    status: "ok" as const,
    account: {
      ...toAccount(context.user),
      name: typeof data.profile.name === "string" ? data.profile.name : input.name,
      avatarUrl:
        typeof data.profile.avatar_url === "string" && data.profile.avatar_url.trim()
          ? data.profile.avatar_url.trim()
          : null,
    },
  };
}

export const { GET, PATCH } = createAccountProfileHandlers(loadAccount, saveAccount);
