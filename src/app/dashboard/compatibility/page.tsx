import { redirect } from "next/navigation";

export default function LegacyCompatibilityRedirectPage() {
  redirect("/dashboard/bonds");
}
