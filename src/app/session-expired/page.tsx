import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/nfc/constants";

export default function SessionExpiredRedirectPage() {
  redirect(HOME_PATH);
}
