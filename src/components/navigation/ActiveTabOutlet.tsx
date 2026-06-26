"use client";

import type { ReactNode } from "react";

interface ActiveTabOutletProps {
  children: ReactNode;
}

/** Yalnızca aktif rotanın içeriğini render eder — gizli sekmeler mount edilmez. */
export default function ActiveTabOutlet({ children }: ActiveTabOutletProps) {
  return <div className="relative w-full">{children}</div>;
}
