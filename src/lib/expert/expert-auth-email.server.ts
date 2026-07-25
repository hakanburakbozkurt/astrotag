import "server-only";

/** auth.users — e-posta ile kullanıcı kimliği */
export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const normalized = email.trim().toLowerCase();

  if (!supabaseUrl || !serviceRoleKey || !normalized) {
    return null;
  }

  const url = new URL(`${supabaseUrl}/auth/v1/admin/users`);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("filter", `email.eq.${normalized}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as {
      users?: Array<{ id?: string }>;
    };

    return body.users?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export function normalizeExpertEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidExpertEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function getAuthUserEmail(authUserId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !authUserId.trim()) {
    return null;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { email?: string };
    return body.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}
