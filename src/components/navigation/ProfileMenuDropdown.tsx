"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { checkIsAdminAction } from "@/lib/actions/admin-users";
import { getExpertMenuAccessAction } from "@/lib/actions/expert-panel";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import SignOutButton from "@/components/dashboard/SignOutButton";
import ProfileMenuBalance from "@/components/navigation/ProfileMenuBalance";
import { Colors } from "@/lib/navigation/dashboard-colors";
import { GUEST_MENU_LINKS } from "@/lib/navigation/profile-menu-guest-config";
import { PROFILE_MENU_LINKS } from "@/lib/navigation/profile-menu-config";

interface ProfileMenuDropdownProps {
  open: boolean;
  onClose: () => void;
  mode?: "profile" | "guest";
}

function ProfileMenuDropdownInner({
  open,
  onClose,
  mode = "profile",
}: ProfileMenuDropdownProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showExpertServices, setShowExpertServices] = useState(false);

  useEffect(() => {
    if (mode !== "profile") {
      return;
    }

    let cancelled = false;

    void (async () => {
      const [admin, expertAccess] = await Promise.all([
        checkIsAdminAction(),
        getExpertMenuAccessAction(),
      ]);
      if (!cancelled) {
        setIsAdmin(admin);
        setShowExpertServices(expertAccess.showExpertServices);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  const handleLinkClick = useCallback(() => onClose(), [onClose]);
  const links = useMemo(() => {
    if (mode === "guest") {
      return GUEST_MENU_LINKS;
    }

    return PROFILE_MENU_LINKS.filter((item) => {
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      if (item.expertOnly && !showExpertServices) {
        return false;
      }
      return true;
    });
  }, [isAdmin, mode, showExpertServices]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto absolute right-0 top-[calc(100%+8px)] z-[110] w-64 overflow-hidden ${Colors.menu}`}
          role="menu"
        >
          {mode === "profile" ? (
            <>
              <ProfileMenuBalance />
              <div className={Colors.menuDivider} />
            </>
          ) : (
            <div className="px-4 py-3">
              <p className="text-xs text-stone-500">Hesabın yok mu?</p>
              <p className="mt-1 text-sm text-stone-300">Giriş yap veya kayıt ol.</p>
            </div>
          )}
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={handleLinkClick}
              className={Colors.menuItem}
            >
              {item.label}
            </Link>
          ))}
          {mode === "profile" ? (
            <div className={`${Colors.menuDivider} p-3`}>
              <SignOutButton className={Colors.signOut} />
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default memo(ProfileMenuDropdownInner);
