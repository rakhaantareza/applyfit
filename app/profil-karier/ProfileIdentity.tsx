"use client";

/* eslint-disable @next/next/no-img-element -- Account avatars can come from user-provided HTTPS hosts. */

import { BadgeCheck } from "lucide-react";
import {
  getAccountInitials,
  getAuthDisplayName,
  useAuthSession,
} from "../components/AuthSessionProvider";

type ProfileIdentityProps = {
  fallbackName: string;
  summary: string;
};

export function ProfileIdentity({ fallbackName, summary }: ProfileIdentityProps) {
  const { user, loading } = useAuthSession();
  const name = loading ? fallbackName : getAuthDisplayName(user);
  const avatarUrl = user?.profile?.avatar_url?.trim() || null;

  return (
    <div className="profile-identity">
      <span className="profile-avatar" aria-hidden="true">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : getAccountInitials(name)}
      </span>
      <div>
        <span className="profile-status">
          <BadgeCheck aria-hidden="true" size={15} strokeWidth={1.9} />
          Profil aktif
        </span>
        <h2 id="profile-name">{name}</h2>
        <p>{summary}</p>
      </div>
    </div>
  );
}
