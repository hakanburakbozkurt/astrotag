"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dismissDailyCosmicModalAction,
  prepareDailyCosmicModalAction,
} from "@/lib/actions/manifesto";
import type { UserManifestoRecord } from "@/lib/manifesto/types";
import type { UserData } from "@/types/user";
import DailyCosmicModal from "@/components/home/DailyCosmicModal";

interface DailyCosmicModalGateProps {
  user: UserData;
}

export default function DailyCosmicModalGate({ user }: DailyCosmicModalGateProps) {
  const [open, setOpen] = useState(false);
  const [manifesto, setManifesto] = useState<UserManifestoRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const payload = await prepareDailyCosmicModalAction(user);
      if (cancelled) {
        return;
      }

      if (payload.showModal && payload.manifesto) {
        setManifesto(payload.manifesto);
        setOpen(true);
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAccept = useCallback(async () => {
    if (manifesto) {
      await dismissDailyCosmicModalAction(manifesto.id);
    }

    setOpen(false);

    requestAnimationFrame(() => {
      document.getElementById("manifesto-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [manifesto]);

  if (!ready) {
    return null;
  }

  return (
    <DailyCosmicModal
      open={open}
      manifesto={manifesto}
      userName={user.name}
      onAccept={() => void handleAccept()}
    />
  );
}
