import { redirect } from "next/navigation";

/** Eski /login rotası — NFC Zero-Click akışına yönlendir */
export default function LoginRedirectPage() {
  redirect("/");
}
