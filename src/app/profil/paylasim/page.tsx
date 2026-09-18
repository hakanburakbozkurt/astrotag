"use client";

import dynamic from "next/dynamic";
import ProfilPageGate from "@/components/profil/ProfilPageGate";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";

const ProfilPaylasimContent = dynamic(
  () => import("@/components/profil/ProfilPaylasimContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ProfilPaylasimPage() {
  return (
    <ProfilPageGate>{() => <ProfilPaylasimContent />}</ProfilPageGate>
  );
}
