"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import AdminExpertApplicationDetails from "@/components/admin/AdminExpertApplicationDetails";
import {
  approveExpertApplicationAction,
  listPendingExpertApplicationsAction,
  type AdminPendingExpert,
} from "@/lib/actions/admin-experts";
import { checkIsAdminAction } from "@/lib/actions/admin-users";
import {
  externalLinkLabel,
  normalizeExternalUrl,
} from "@/lib/admin/external-url";

export default function AdminExpertApprovalPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [experts, setExperts] = useState<AdminPendingExpert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await listPendingExpertApplicationsAction();
    if (!result.ok) {
      setError(result.error);
      setExperts([]);
      setLoading(false);
      return;
    }

    setExperts(result.experts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const admin = await checkIsAdminAction();
      setIsAdmin(admin);
      if (admin) {
        await loadExperts();
      }
    })();
  }, [loadExperts]);

  const handleApprove = async (expert: AdminPendingExpert) => {
    setPendingId(expert.expertProfileId);
    setError(null);
    setMessage(null);

    const result = await approveExpertApplicationAction(expert.expertProfileId);
    if (!result.ok) {
      setError(result.error);
      setPendingId(null);
      return;
    }

    setExperts((current) =>
      current.filter((row) => row.expertProfileId !== expert.expertProfileId)
    );
    if (expandedId === expert.expertProfileId) {
      setExpandedId(null);
    }
    setMessage(`${expert.displayName} vitrine onaylandı.`);
    setPendingId(null);
  };

  const toggleDetails = (expertProfileId: string) => {
    setExpandedId((current) => (current === expertProfileId ? null : expertProfileId));
  };

  if (isAdmin === null || !isAdmin) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sm border border-zinc-800 bg-zinc-950 p-5 sm:p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
        Admin · Uzman Onayları
      </p>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        Bekleyen başvuruları inceleyin, detayları açın ve vitrine çıkarın.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-stone-500">Başvurular yükleniyor…</p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-stone-400">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-stone-300">{message}</p> : null}

      {!loading && experts.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">Bekleyen uzman başvurusu yok.</p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {experts.map((expert) => {
          const isExpanded = expandedId === expert.expertProfileId;
          const socialUrl = expert.socialProfileUrl
            ? normalizeExternalUrl(expert.socialProfileUrl)
            : null;

          return (
            <li
              key={expert.expertProfileId}
              className="rounded-sm border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-200">{expert.displayName}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {expert.title} · {expert.tradition} · {expert.experienceYears} yıl
                  </p>
                  {expert.email ? (
                    <p className="mt-1 text-xs text-stone-500">{expert.email}</p>
                  ) : null}
                  {socialUrl ? (
                    <a
                      href={socialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-stone-400 underline underline-offset-2 transition hover:text-stone-200"
                    >
                      {externalLinkLabel(expert.socialProfileUrl ?? socialUrl)}
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDetails(expert.expertProfileId)}
                    className="inline-flex items-center gap-1 rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] uppercase tracking-wider text-stone-400 transition hover:border-zinc-600 hover:text-stone-200"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <>
                        Detayları Gizle
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                      </>
                    ) : (
                      <>
                        Detayları Gör
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={pendingId === expert.expertProfileId}
                    onClick={() => void handleApprove(expert)}
                    className="rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-2 text-[11px] uppercase tracking-wider text-stone-300 transition hover:border-zinc-600 disabled:opacity-50"
                  >
                    {pendingId === expert.expertProfileId
                      ? "Onaylanıyor…"
                      : "Onayla / Vitrine Çıkar"}
                  </button>
                </div>
              </div>

              {isExpanded ? <AdminExpertApplicationDetails expert={expert} /> : null}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
