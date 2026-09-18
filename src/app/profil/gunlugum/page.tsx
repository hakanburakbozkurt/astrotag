"use client";

import dynamic from "next/dynamic";
import ProfilPageGate from "@/components/profil/ProfilPageGate";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";

const ProfilGunlugumContent = dynamic(
  () => import("@/components/profil/ProfilGunlugumContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ProfilGunlugumPage() {
  return (
    <ProfilPageGate>{() => <ProfilGunlugumContent />}</ProfilPageGate>
  );
}
