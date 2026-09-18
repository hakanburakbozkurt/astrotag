"use client";

import type { ReactNode } from "react";
import type { AdminPendingExpert } from "@/lib/actions/admin-experts";
import {
  externalLinkLabel,
  normalizeExternalUrl,
} from "@/lib/admin/external-url";

interface AdminExpertApplicationDetailsProps {
  expert: AdminPendingExpert;
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="grid min-w-0 gap-1 border-t border-zinc-800 py-3 first:border-t-0 first:pt-0">
      <dt className="text-[10px] uppercase tracking-[0.22em] text-stone-500">{label}</dt>
      <dd
        className={`min-w-0 break-words text-sm leading-relaxed text-stone-300 ${
          mono ? "break-all font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function biographyText(expert: AdminPendingExpert): string {
  return expert.about?.trim() || expert.aboutText.trim();
}

export default function AdminExpertApplicationDetails({
  expert,
}: AdminExpertApplicationDetailsProps) {
  const socialUrl = expert.socialProfileUrl
    ? normalizeExternalUrl(expert.socialProfileUrl)
    : null;
  const avatarUrl = expert.avatarUrl ? normalizeExternalUrl(expert.avatarUrl) : null;
  const biography = biographyText(expert);

  return (
    <div className="mt-4 min-w-0 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
        Başvuru Detayları
      </p>

      <dl className="mt-3 min-w-0">
        <DetailRow label="Ad Soyad" value={expert.displayName} />
        <DetailRow label="Unvan" value={expert.title} />
        <DetailRow label="Uzmanlık Alanı" value={expert.tradition} />
        <DetailRow label="Deneyim (yıl)" value={`${expert.experienceYears} yıl`} />
        <DetailRow label="E-posta" value={expert.email} mono />
        <DetailRow label="Telefon" value={expert.phoneNumber} mono />
        <DetailRow label="Uzman Kodu" value={expert.expertCode} mono />
        <DetailRow label="NFC UID" value={expert.nfcUid} mono />
        <DetailRow label="Onay Durumu" value={expert.approvalStatus} />
        <DetailRow
          label="Başvuru Tarihi"
          value={formatDateTime(expert.submittedAt)}
        />
        <DetailRow label="Son Güncelleme" value={formatDateTime(expert.updatedAt)} />

        {biography ? (
          <DetailRow
            label="Biyografi"
            value={<p className="whitespace-pre-wrap break-words">{biography}</p>}
          />
        ) : null}

        {expert.experienceText?.trim() ? (
          <DetailRow
            label="Tecrübe Detayı"
            value={
              <p className="whitespace-pre-wrap break-words">
                {expert.experienceText.trim()}
              </p>
            }
          />
        ) : null}

        {expert.philosophyText.trim() ? (
          <DetailRow
            label="Felsefe / Yaklaşım"
            value={
              <p className="whitespace-pre-wrap break-words">
                {expert.philosophyText.trim()}
              </p>
            }
          />
        ) : null}

        {socialUrl ? (
          <DetailRow
            label="Sosyal Medya / Web"
            value={
              <a
                href={socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-start gap-1 break-all text-stone-300 underline underline-offset-2 transition hover:text-white"
              >
                <span>{externalLinkLabel(expert.socialProfileUrl ?? socialUrl)}</span>
                <span aria-hidden="true" className="shrink-0">
                  ↗
                </span>
              </a>
            }
          />
        ) : null}

        {avatarUrl ? (
          <DetailRow
            label="Avatar"
            value={
              <a
                href={avatarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-stone-300 underline underline-offset-2 transition hover:text-white"
              >
                Profil görselini aç ↗
              </a>
            }
          />
        ) : null}

        <DetailRow label="Profil ID" value={expert.profileId} mono />
        <DetailRow label="Uzman Profil ID" value={expert.expertProfileId} mono />
      </dl>
    </div>
  );
}
