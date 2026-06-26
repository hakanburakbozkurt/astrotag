import "server-only";

/** Service role ile auth.users içinde e-posta var mı */
export async function authEmailExists(email: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return true;
  }

  const normalized = email.trim().toLowerCase();
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
      return true;
    }

    const body = (await response.json()) as { users?: unknown[] };
    return Array.isArray(body.users) && body.users.length > 0;
  } catch {
    return true;
  }
}
