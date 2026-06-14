import { redirect } from "next/navigation";

export default function LegacyHoraryRedirectPage() {
  redirect("/dashboard/oracle/horary");
}
