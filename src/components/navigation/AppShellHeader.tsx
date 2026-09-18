"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUserProfile } from "@/lib/auth";
import { Colors } from "@/lib/navigation/dashboard-colors";
import ProfileAvatarButton from "@/components/navigation/ProfileAvatarButton";
import ProfileMenuDropdown from "@/components/navigation/ProfileMenuDropdown";

function AppShellHeaderInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const { userData } = useUserProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const root = menuRootRef.current;
      if (root && !root.contains(event.target as Node)) {
        closeMenu();
      }
    }

    let attached = false;
    const frame = requestAnimationFrame(() => {
      attached = true;
      document.addEventListener("pointerdown", handlePointerDown, true);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (attached) {
        document.removeEventListener("pointerdown", handlePointerDown, true);
      }
    };
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    closeMenu();
  }, [closeMenu, isAuthenticated]);

  const displayName = userData?.name ?? "Gezgin";
  const showProfileMenu = isAuthenticated && !isLoading;

  return (
    <header
      className={`relative z-[100] flex shrink-0 items-center justify-between px-4 py-3 ${Colors.header}`}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="w-9" aria-hidden />
      <p className={Colors.brand}>ASTROTAG</p>
      <div ref={menuRootRef} className="relative z-[100]">
        <ProfileAvatarButton
          displayName={showProfileMenu ? displayName : "G"}
          onClick={toggleMenu}
          isOpen={menuOpen}
        />
        <ProfileMenuDropdown
          open={menuOpen}
          onClose={closeMenu}
          mode={showProfileMenu ? "profile" : "guest"}
        />
      </div>
    </header>
  );
}

export default memo(AppShellHeaderInner);
