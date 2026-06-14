"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

const TAB_ROOT_PATHS = new Set([
  "/dashboard",
  "/dashboard/oracle",
  "/dashboard/bonds",
  "/dashboard/profile",
]);

function isTabRoot(pathname: string): boolean {
  return TAB_ROOT_PATHS.has(pathname);
}

interface TabKeepAliveOutletProps {
  children: ReactNode;
}

/** Ana sekme köklerinde içeriği DOM'da tutar; sekme geçişlerinde state korunur. */
export default function TabKeepAliveOutlet({ children }: TabKeepAliveOutletProps) {
  const pathname = usePathname();
  const cacheRef = useRef<Map<string, ReactNode>>(new Map());

  if (isTabRoot(pathname)) {
    cacheRef.current.set(pathname, children);
  }

  const cachedEntries = Array.from(cacheRef.current.entries());

  return (
    <>
      {cachedEntries.map(([path, node]) => (
        <div
          key={path}
          className={
            path === pathname
              ? "relative flex min-h-0 flex-1 flex-col"
              : "hidden"
          }
          aria-hidden={path !== pathname}
        >
          {node}
        </div>
      ))}

      {!isTabRoot(pathname) ? (
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      ) : null}
    </>
  );
}
