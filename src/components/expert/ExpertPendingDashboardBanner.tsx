"use client";

import { useEffect, useState } from "react";
import { getExpertPanelDataAction } from "@/lib/actions/expert-panel";
import { EXPERT_APPROVAL_PENDING } from "@/lib/expert/expert-approval.shared";
import ExpertPendingApprovalScreen from "@/components/expert/ExpertPendingApprovalScreen";

export default function ExpertPendingDashboardBanner() {
  const [visible, setVisible] = useState(false);
  const [displayName, setDisplayName] = useState<string | undefined>();

  useEffect(() => {
    void (async () => {
      const panel = await getExpertPanelDataAction();
      if (
        panel?.isExpert &&
        panel.approvalStatus === EXPERT_APPROVAL_PENDING
      ) {
        setDisplayName(panel.displayName);
        setVisible(true);
        return;
      }

      setVisible(false);
    })();
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="mb-5">
      <ExpertPendingApprovalScreen displayName={displayName} compact />
    </div>
  );
}
