import { NextResponse, type NextRequest } from "next/server";
import {
  LOGIN_PATH,
  NFC_SESSION_COOKIE,
  PUBLIC_PATHS,
} from "@/lib/nfc/constants";

function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }

  if (pathname.startsWith("/login")) {
    return false;
  }

  if (pathname.startsWith("/api/debug-log")) {
    return false;
  }

  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/ai")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(NFC_SESSION_COOKIE)?.value?.trim();

  if (!sessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|se1)$).*)",
  ],
};
