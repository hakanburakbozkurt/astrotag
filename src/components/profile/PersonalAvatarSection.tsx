"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ExpertAvatar from "@/components/experts/ExpertAvatar";
import {
  getPersonalAvatarDataAction,
  uploadUserProfileAvatarAction,
} from "@/lib/actions/profile-avatar";
import { uploadExpertAvatarAction } from "@/lib/actions/expert-profile";
import { useUserProfile } from "@/lib/auth";

type PersonalAvatarSectionProps = {
  displayName: string;
};

export default function PersonalAvatarSection({
  displayName,
}: PersonalAvatarSectionProps) {
  const { refreshProfile } = useUserProfile();
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const expertFileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingTarget, setUploadingTarget] = useState<
    "user" | "expert" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpert, setIsExpert] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [expertAvatarUrl, setExpertAvatarUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPersonalAvatarDataAction();
    if (data) {
      setIsExpert(data.isExpert);
      setUserAvatarUrl(data.userAvatarUrl);
      setExpertAvatarUrl(data.expertAvatarUrl);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUserUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingTarget("user");
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.set("avatar", file);

    const result = await uploadUserProfileAvatarAction(formData);
    setUploadingTarget(null);
    event.target.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setUserAvatarUrl(result.avatarUrl);
    await refreshProfile();
    setMessage("Profil fotoğrafınız güncellendi.");
  };

  const handleExpertUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingTarget("expert");
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.set("avatar", file);

    const result = await uploadExpertAvatarAction(formData);
    setUploadingTarget(null);
    event.target.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setExpertAvatarUrl(result.avatarUrl);
    setMessage("Uzman profil fotoğrafınız güncellendi.");
  };

  if (loading) {
    return (
      <section className="rounded-sm border border-zinc-800 bg-[#09090b] p-5">
        <p className="text-sm text-zinc-500">Profil fotoğrafı yükleniyor…</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-sm border border-zinc-800 bg-[#09090b] p-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">
          Profil Fotoğrafı
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Kare görsel önerilir · JPEG, PNG veya WebP · en fazla 5 MB
        </p>
      </div>

      {isExpert ? (
        <div className="flex flex-wrap items-center gap-5 border-b border-zinc-800 pb-5">
          <ExpertAvatar
            avatarUrl={expertAvatarUrl}
            displayName={displayName}
            size="profile"
            ring={false}
          />
          <div className="min-w-0 space-y-2">
            <p className="font-serif text-sm text-zinc-300">Uzman vitrin fotoğrafı</p>
            <p className="text-xs text-zinc-600">
              Hizmet kartı ve akış gönderisi oluşturmak için zorunludur.
            </p>
            {!expertAvatarUrl ? (
              <p className="text-xs text-zinc-500">
                Henüz yüklenmedi — lütfen bir profil fotoğrafı ekleyin.
              </p>
            ) : null}
            <input
              ref={expertFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => void handleExpertUpload(event)}
            />
            <button
              type="button"
              disabled={uploadingTarget === "expert"}
              onClick={() => expertFileInputRef.current?.click()}
              className="rounded-sm border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
            >
              {uploadingTarget === "expert" ? "Yükleniyor…" : "Uzman Fotoğrafı Yükle"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-5">
        <ExpertAvatar
          avatarUrl={userAvatarUrl}
          displayName={displayName}
          size={isExpert ? "grid" : "profile"}
          ring={false}
        />
        <div className="min-w-0 space-y-2">
          <p className="font-serif text-sm text-zinc-300">
            {isExpert ? "Kişisel hesap fotoğrafı" : "Profil fotoğrafı"}
          </p>
          <p className="text-xs text-zinc-600">
            {isExpert ? "İsteğe bağlı — menü ve kişisel alanlarda görünür." : "İsteğe bağlı."}
          </p>
          <input
            ref={userFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleUserUpload(event)}
          />
          <button
            type="button"
            disabled={uploadingTarget === "user"}
            onClick={() => userFileInputRef.current?.click()}
            className="rounded-sm border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
          >
            {uploadingTarget === "user" ? "Yükleniyor…" : "Fotoğraf Yükle"}
          </button>
        </div>
      </div>

      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
      {error ? <p className="text-xs text-zinc-500">{error}</p> : null}
    </section>
  );
}
