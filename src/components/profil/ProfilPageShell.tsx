"use client";

import type { ReactNode } from "react";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import SubPageNav from "@/components/navigation/SubPageNav";

interface ProfilPageShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function ProfilPageShell({
  eyebrow,
  title,
  description,
  children,
}: ProfilPageShellProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg px-4 py-4 pb-10">
      <SubPageNav backHref="/dashboard" closeHref="/dashboard" />
      <TabPageScaffold eyebrow={eyebrow} title={title} description={description}>
        {children}
      </TabPageScaffold>
    </div>
  );
}
