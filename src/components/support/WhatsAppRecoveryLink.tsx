"use client";

import { openWhatsAppRecovery } from "@/lib/support/whatsapp-recovery.client";
import type { WhatsAppRecoveryContext } from "@/lib/support/whatsapp-recovery.shared";

type WhatsAppRecoveryLinkProps = {
  context: WhatsAppRecoveryContext;
  label?: string;
  className?: string;
};

export default function WhatsAppRecoveryLink({
  context,
  label = "PIN'imi Unuttum",
  className = "text-center text-[11px] font-medium text-emerald-300/90 underline-offset-2 hover:underline",
}: WhatsAppRecoveryLinkProps) {
  return (
    <button
      type="button"
      onClick={() => openWhatsAppRecovery(context)}
      className={className}
    >
      {label}
    </button>
  );
}
