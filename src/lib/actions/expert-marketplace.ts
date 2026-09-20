"use server";

import {
  confirmExpertServicePurchase,
  getServicePurchasePreview,
} from "@/lib/experts/experts.server";
import type { ServicePurchasePreview } from "@/lib/experts/service-marketplace.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";

export async function getServicePurchasePreviewAction(
  expertProfileId: string,
  serviceId: string
): Promise<
  | { ok: true; preview: ServicePurchasePreview }
  | { ok: false; error: string }
> {
  try {
    const profileId = await requireAuthUserId();
    const preview = await getServicePurchasePreview({
      userProfileId: profileId,
      expertProfileId,
      serviceId,
    });

    if (!preview) {
      return { ok: false, error: "Hizmet bulunamadı veya vitrin dışı." };
    }

    return { ok: true, preview };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function confirmExpertServicePurchaseAction(input: {
  expertProfileId: string;
  serviceId: string;
  clientNote?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const profileId = await requireAuthUserId();
    return confirmExpertServicePurchase({
      userProfileId: profileId,
      expertProfileId: input.expertProfileId,
      serviceId: input.serviceId,
      clientNote: input.clientNote?.trim() || null,
    });
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}
