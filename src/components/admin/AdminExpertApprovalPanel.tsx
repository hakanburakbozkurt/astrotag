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

const actionButtonClassName =
  "inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-[11px] uppercase tracking-wider transition hover:border-zinc-600 disabled:opacity-50 sm:min-h-11";

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
      className="min-w-0 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950 p-4 sm:p-5"
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
          const isApproving = pendingId === expert.expertProfileId;

          return (
            <li
              key={expert.expertProfileId}
              className="min-w-0 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900"
            >
              <div className="flex flex-col gap-4 p-4">
                <div className="min-w-0 space-y-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-medium leading-snug text-stone-200">
                      {expert.displayName}
                    </p>
                    <p className="mt-1.5 break-words text-xs leading-relaxed text-stone-500">
                      {expert.title}
                    </p>
                  </div>

                  <dl className="grid min-w-0 gap-2 text-xs">
                    <div className="grid min-w-0 gap-0.5">
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-stone-600">
                        Uzmanlık
                      </dt>
                      <dd className="break-words text-stone-400">
                        {expert.tradition} · {expert.experienceYears} yıl
                      </dd>
                    </div>

                    {expert.email ? (
                      <div className="grid min-w-0 gap-0.5">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-stone-600">
                          E-posta
                        </dt>
                        <dd className="break-all text-stone-400">{expert.email}</dd>
                      </div>
                    ) : null}

                    {socialUrl ? (
                      <div className="grid min-w-0 gap-0.5">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-stone-600">
                          Sosyal / Web
                        </dt>
                        <dd className="min-w-0">
                          <a
                            href={socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-start gap-1 break-all text-stone-300 underline underline-offset-2 transition hover:text-stone-100"
                          >
                            <span>{externalLinkLabel(expert.socialProfileUrl ?? socialUrl)}</span>
                            <span aria-hidden="true" className="shrink-0">
                              ↗
                            </span>
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-2 border-t border-zinc-800 pt-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => toggleDetails(expert.expertProfileId)}
                    className={`${actionButtonClassName} text-stone-400 hover:text-stone-200`}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <>
                        <span>Detayları Gizle</span>
                        <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </>
                    ) : (
                      <>
                        <span>Detayları Gör</span>
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isApproving}
                    onClick={() => void handleApprove(expert)}
                    className={`${actionButtonClassName} text-stone-300`}
                  >
                    {isApproving ? "Onaylanıyor…" : "Onayla / Vitrine Çıkar"}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t border-zinc-800 px-4 pb-4">
                  <AdminExpertApplicationDetails expert={expert} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
