import type { ReactNode } from "react";
import {
  AppSidebar,
  type AppSidebarActiveItem,
} from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

type AppShellProps = {
  activeItem: AppSidebarActiveItem;
  children: ReactNode;
  mainClassName?: string;
};

export function AppShell({
  activeItem,
  children,
  mainClassName,
}: AppShellProps) {
  const mainClasses = ["main-content", mainClassName].filter(Boolean).join(" ");

  return (
    <div className="app-shell">
      <AppTopBar showSidebarControls />
      <AppSidebar activeItem={activeItem} />
      <main className={mainClasses} id="top">
        {children}
      </main>
    </div>
  );
}
