"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { enterProfileEditModeAction } from "@/lib/actions/profile-edit-mode";
import { savePostAuthReturnToAction } from "@/lib/actions/post-auth-return";

function ProfileEditModeBootstrapInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode !== "edit") {
      return;
    }

    void enterProfileEditModeAction();
    void savePostAuthReturnToAction("/profile-setup?mode=edit");
  }, [searchParams]);

  return null;
}

export default function ProfileEditModeBootstrap() {
  return (
    <Suspense fallback={null}>
      <ProfileEditModeBootstrapInner />
    </Suspense>
  );
}
