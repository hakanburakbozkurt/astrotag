"use client";

import dynamic from "next/dynamic";
import ProfilPageGate from "@/components/profil/ProfilPageGate";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";

const ProfilHesapContent = dynamic(
  () => import("@/components/profil/ProfilHesapContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ProfilHesapPage() {
  return (
    <ProfilPageGate>{() => <ProfilHesapContent />}</ProfilPageGate>
  );
}
