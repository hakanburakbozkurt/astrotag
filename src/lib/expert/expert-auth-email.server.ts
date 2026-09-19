import "server-only";

async function fetchAuthUsersPage(
  supabaseUrl: string,
  serviceRoleKey: string,
  page: number,
  perPage: number
): Promise<Array<{ id?: string; email?: string }>> {
  const url = new URL(`${supabaseUrl}/auth/v1/admin/users`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as {
    users?: Array<{ id?: string; email?: string }>;
  };

  return body.users ?? [];
}

/** auth.users — e-posta ile kullanıcı kimliği */
export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const normalized = email.trim().toLowerCase();

  if (!supabaseUrl || !serviceRoleKey || !normalized) {
    return null;
  }

  try {
    const filteredUrl = new URL(`${supabaseUrl}/auth/v1/admin/users`);
    filteredUrl.searchParams.set("page", "1");
    filteredUrl.searchParams.set("per_page", "1");
    filteredUrl.searchParams.set("filter", `email.eq.${normalized}`);

    const filteredResponse = await fetch(filteredUrl.toString(), {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      cache: "no-store",
    });

    if (filteredResponse.ok) {
      const filteredBody = (await filteredResponse.json()) as {
        users?: Array<{ id?: string; email?: string }>;
      };
      const filteredMatch = filteredBody.users?.find(
        (user) => user.email?.trim().toLowerCase() === normalized
      );
      if (filteredMatch?.id) {
        return filteredMatch.id;
      }
    }

    for (let page = 1; page <= 5; page += 1) {
      const users = await fetchAuthUsersPage(supabaseUrl, serviceRoleKey, page, 200);
      if (users.length === 0) {
        break;
      }

      const match = users.find(
        (user) => user.email?.trim().toLowerCase() === normalized
      );
      if (match?.id) {
        return match.id;
      }

      if (users.length < 200) {
        break;
      }
    }

    return null;
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

export async function updateAuthUserPassword(
  authUserId: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !authUserId.trim()) {
    return { ok: false, error: "Şifre güncellenemedi." };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          email_confirm: true,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let message = "Şifre güncellenemedi.";
      try {
        const body = (await response.json()) as { msg?: string; message?: string };
        message = body.msg?.trim() || body.message?.trim() || message;
      } catch {
        // ignore parse errors
      }
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Şifre güncellenemedi." };
  }
}

export async function deleteAuthUser(authUserId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !authUserId.trim()) {
    return false;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        cache: "no-store",
      }
    );

    return response.ok;
  } catch {
    return false;
  }
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
