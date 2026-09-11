"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useI18n } from "./LanguageProvider";
export function SignOutButton({ menuItem = false }: { menuItem?: boolean }) {
  const { t } = useI18n();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  async function logOutSession() {
    setAccountError("");
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok && response.status !== 204) {
        throw new Error("Sesi belum dapat diakhiri.");
      }
      window.location.assign("/login");
    } catch (requestError) {
      setAccountError(
        requestError instanceof Error
          ? requestError.message
          : "Sesi belum dapat diakhiri.",
      );
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      {accountError ? (
        <p className="topbar-account-error" role="alert">
          {t(accountError)}
        </p>
      ) : null}
      <button
        className="topbar-signout"
        type="button"
        role={menuItem ? "menuitem" : undefined}
        disabled={isLoggingOut}
        onClick={logOutSession}
      >
        <LogOut size={16} aria-hidden="true" />
        {isLoggingOut ? t("Mengakhiri sesi…") : t("Keluar")}
      </button>
    </>
  );
}
