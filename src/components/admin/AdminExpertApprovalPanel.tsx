"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  approveExpertApplicationAction,
  listPendingExpertApplicationsAction,
  type AdminPendingExpert,
} from "@/lib/actions/admin-experts";
import { checkIsAdminAction } from "@/lib/actions/admin-users";

export default function AdminExpertApprovalPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [experts, setExperts] = useState<AdminPendingExpert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    setMessage(`${expert.displayName} vitrine onaylandı.`);
    setPendingId(null);
  };

  if (isAdmin === null || !isAdmin) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-emerald-400/20 bg-emerald-950/10 p-5 backdrop-blur-2xl sm:p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/80">
        Admin · Uzman Onayları
      </p>
      <p className="mt-2 text-xs text-white/45">
        Bekleyen başvuruları inceleyin ve vitrine çıkarın.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-white/40">Başvurular yükleniyor…</p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-300/85">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-300/85">{message}</p> : null}

      {!loading && experts.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">Bekleyen uzman başvurusu yok.</p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {experts.map((expert) => (
          <li
            key={expert.expertProfileId}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white/90">{expert.displayName}</p>
                <p className="mt-1 text-xs text-white/50">
                  {expert.title} · {expert.tradition} · {expert.experienceYears} yıl
                </p>
                {expert.email ? (
                  <p className="mt-1 text-xs text-white/40">{expert.email}</p>
                ) : null}
                {expert.aboutText ? (
                  <p className="mt-2 line-clamp-3 text-xs text-white/45">
                    {expert.aboutText}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                disabled={pendingId === expert.expertProfileId}
                onClick={() => void handleApprove(expert)}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[11px] uppercase tracking-wider text-emerald-100 disabled:opacity-50"
              >
                {pendingId === expert.expertProfileId
                  ? "Onaylanıyor…"
                  : "Onayla / Vitrine Çıkar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
