"use server";

/** @deprecated E-posta tabanlı şifre sıfırlama kaldırıldı — WhatsApp kurtarma kullanın */
export async function updateUserPassword(): Promise<{
  success: false;
  error: string;
}> {
  return {
    success: false,
    error:
      "Şifre sıfırlama e-posta ile yapılmaz. Giriş ekranındaki WhatsApp destek bağlantısını kullanın.",
  };
}
