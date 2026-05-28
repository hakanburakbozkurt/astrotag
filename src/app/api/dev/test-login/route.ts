import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const DEFAULT_DEV_USER_ID = "9b32b79a-d916-45d0-adba-99f9e3ffb35e";

function isDevModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === "true";
}

export async function POST() {
  if (!isDevModeEnabled()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase ortam değişkenleri eksik." },
      { status: 500 }
    );
  }

  const devUserId = process.env.DEV_TEST_USER_ID ?? DEFAULT_DEV_USER_ID;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data: userResult, error: userError } =
      await admin.auth.admin.getUserById(devUserId);

    if (userError || !userResult.user?.email) {
      return NextResponse.json(
        { error: "Geliştirici test kullanıcısı bulunamadı." },
        { status: 404 }
      );
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userResult.user.email,
      });

    const tokenHash = linkData?.properties?.hashed_token;

    if (linkError || !tokenHash) {
      return NextResponse.json(
        { error: "Test oturumu oluşturulamadı." },
        { status: 500 }
      );
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: sessionData, error: verifyError } =
      await anonClient.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });

    if (verifyError || !sessionData.session) {
      return NextResponse.json(
        { error: verifyError?.message ?? "Oturum doğrulanamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      dev_mode_logged_in: true,
    });
  } catch (error) {
    console.error("DEV_TEST_LOGIN_ERROR:", error);

    return NextResponse.json(
      { error: "Geliştirici girişi başarısız oldu." },
      { status: 500 }
    );
  }
}
