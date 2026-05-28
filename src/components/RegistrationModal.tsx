"use client";

import ProfileCompleteForm from "@/components/profile/ProfileCompleteForm";
import type { UserData } from "@/types/user";

export type { UserData };

interface RegistrationModalProps {
  onComplete: (data: UserData) => void;
}

/** @deprecated Profil tamamlama için `/profile/complete` kullanın. */
export default function RegistrationModal({ onComplete }: RegistrationModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-x-hidden px-4 py-8">
      <div className="relative mx-auto w-full max-w-md min-w-0 rounded-[32px] border border-white/10 bg-[#0f172a]/80 p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
        <ProfileCompleteForm onComplete={onComplete} submitLabel="Kaydol" />
      </div>
    </div>
  );
}
