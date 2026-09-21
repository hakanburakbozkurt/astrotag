"use client";

import { memo, Suspense } from "react";
import DailyCosmicModalGate from "@/components/home/DailyCosmicModalGate";
import ExpertPendingDashboardBanner from "@/components/expert/ExpertPendingDashboardBanner";
import DashboardModuleGrid from "@/components/navigation/DashboardModuleGrid";
import CrystalPaymentResultBanner from "@/components/wallet/CrystalPaymentResultBanner";
import type { UserData } from "@/types/user";

interface DashboardHomeProps {
  user: UserData;
}

function DashboardHomeInner({ user }: DashboardHomeProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg px-4 py-6 pb-10 sm:px-5">
      <Suspense fallback={null}>
        <CrystalPaymentResultBanner />
      </Suspense>
      <DailyCosmicModalGate user={user} />
      <ExpertPendingDashboardBanner />
      <DashboardModuleGrid />
    </div>
  );
}

export default memo(DashboardHomeInner);
