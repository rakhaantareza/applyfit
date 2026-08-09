import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import {
  createCareerProfileHandlers,
  type CareerProfileResult,
  type CareerProfileUpdateResult,
} from "../../../server/http/career-profile-handler.ts";
import {
  getCareerProfile,
  saveCareerTarget,
  type CareerTargetInput,
} from "../../../server/services/career-profile.ts";

class CareerProfileServiceError extends Error {
  constructor() {
    super("Layanan profil karier belum tersedia.");
    this.name = "CareerProfileServiceError";
  }
}

async function currentUserContext() {
  let client;
  try {
    client = await createInsForgeServerClient();
  } catch {
    throw new CareerProfileServiceError();
  }

  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new CareerProfileServiceError();
  if (!data.user) return null;

  return { client, userId: data.user.id };
}

async function loadCurrentCareerProfile(): Promise<CareerProfileResult> {
  const context = await currentUserContext();
  if (!context) return { status: "unauthenticated" };

  return {
    status: "ok",
    profile: await getCareerProfile(context.client, context.userId),
  };
}

async function updateCurrentCareerProfile(
  input: CareerTargetInput,
): Promise<CareerProfileUpdateResult> {
  const context = await currentUserContext();
  if (!context) return { status: "unauthenticated" };

  return {
    status: "ok",
    profile: await saveCareerTarget(context.client, context.userId, input),
  };
}

export const { GET, PATCH } = createCareerProfileHandlers(
  loadCurrentCareerProfile,
  updateCurrentCareerProfile,
);
