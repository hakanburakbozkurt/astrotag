"use client";

import Link from "next/link";
import {
  EXPERT_AVATAR_REQUIRED_MESSAGE,
  EXPERT_AVATAR_SETTINGS_PATH,
} from "@/lib/experts/expert-avatar-required.shared";

type ExpertAvatarRequiredNoticeProps = {
  open: boolean;
  onClose: () => void;
  inline?: boolean;
};

export default function ExpertAvatarRequiredNotice({
  open,
  onClose,
  inline = false,
}: ExpertAvatarRequiredNoticeProps) {
  if (!open) {
    return null;
  }

  const body = (
    <>
      <p className="font-serif text-sm text-zinc-200">Profil fotoğrafı gerekli</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        {EXPERT_AVATAR_REQUIRED_MESSAGE}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={EXPERT_AVATAR_SETTINGS_PATH}
          onClick={onClose}
          className="rounded-sm border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-300 transition hover:border-zinc-600"
        >
          Kişisel Bilgiler
        </Link>
        {!inline ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-600 transition hover:text-zinc-500"
          >
            Kapat
          </button>
        ) : null}
      </div>
    </>
  );

  if (inline) {
    return (
      <div
        role="alert"
        className="rounded-sm border border-zinc-800 bg-zinc-950/80 p-4"
      >
        {body}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expert-avatar-required-title"
        className="w-full max-w-md rounded-sm border border-zinc-800 bg-[#09090b] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="expert-avatar-required-title" className="sr-only">
          Profil fotoğrafı gerekli
        </p>
        {body}
      </div>
    </div>
  );
}
