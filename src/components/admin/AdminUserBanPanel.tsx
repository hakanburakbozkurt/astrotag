"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  checkIsAdminAction,
  listAdminManagedUsersAction,
  setAccountActiveStatusAction,
  type AdminManagedUser,
} from "@/lib/actions/admin-users";

export default function AdminUserBanPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await listAdminManagedUsersAction();
    if (!result.ok) {
      setError(result.error);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(result.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const admin = await checkIsAdminAction();
      setIsAdmin(admin);
      if (admin) {
        await loadUsers();
      }
    })();
  }, [loadUsers]);

  const handleToggle = async (user: AdminManagedUser) => {
    setPendingId(user.id);
    setError(null);

    const nextActive = !user.isActive;
    const result = await setAccountActiveStatusAction(user.id, nextActive);

    if (!result.ok) {
      setError(result.error);
      setPendingId(null);
      return;
    }

    setUsers((current) =>
      current.map((row) =>
        row.id === user.id
          ? { ...row, isActive: result.isActive, cardActive: result.isActive }
          : row
      )
    );
    setPendingId(null);
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
        Admin · Hesap Yönetimi
      </p>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        Kullanıcı ve NFC kartını tek tıkla askıya alın. Yıldız bakiyesi yalnızca
        görüntüleme amaçlıdır; kristal bakiyesi ödeme sistemleri üzerinden yönetilir.
      </p>

      {error ? (
        <p className="mt-3 rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-stone-400">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-xs text-stone-500">Kullanıcılar yükleniyor...</p>
        ) : users.length === 0 ? (
          <p className="text-xs text-stone-500">Kayıtlı kullanıcı bulunamadı.</p>
        ) : (
          users.map((user) => {
            const suspended = !user.isActive;
            const busy = pendingId === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-200">{user.name}</p>
                  <p className="truncate font-mono text-[10px] text-stone-500">
                    {user.nfcUid ?? "NFC yok"}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-stone-500">
                    {suspended ? "Askıda" : "Aktif"}
                    {user.cardActive === false ? " · Kart pasif" : ""}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Yıldız:{" "}
                    <span className="font-mono text-stone-300">{user.starPoints}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleToggle(user)}
                  className={`shrink-0 rounded-sm px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition disabled:opacity-60 ${
                    suspended
                      ? "border border-zinc-700 bg-zinc-950 text-stone-300"
                      : "border border-zinc-700 bg-zinc-950 text-stone-400"
                  }`}
                >
                  {busy ? "..." : suspended ? "Aktifleştir" : "Askıya Al"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.section>
  );
}
