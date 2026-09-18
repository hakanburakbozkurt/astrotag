"use client";

import type { ReactNode } from "react";
import SubPageNav from "@/components/navigation/SubPageNav";

interface ModulePageShellProps {
  children: ReactNode;
  backHref?: string;
}

export default function ModulePageShell({
  children,
  backHref = "/dashboard",
}: ModulePageShellProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg px-4 py-4 pb-10">
      <SubPageNav backHref={backHref} closeHref={backHref} />
      {children}
    </div>
  );
}
