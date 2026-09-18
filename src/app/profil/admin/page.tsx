"use client";

import dynamic from "next/dynamic";
import ProfilPageGate from "@/components/profil/ProfilPageGate";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";

const ProfilAdminContent = dynamic(
  () => import("@/components/profil/ProfilAdminContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ProfilAdminPage() {
  return (
    <ProfilPageGate>{() => <ProfilAdminContent />}</ProfilPageGate>
  );
}
