"use client";

import dynamic from "next/dynamic";
import ProfilPageGate from "@/components/profil/ProfilPageGate";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";

const ProfilRozetlerContent = dynamic(
  () => import("@/components/profil/ProfilRozetlerContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ProfilRozetlerPage() {
  return (
    <ProfilPageGate>{() => <ProfilRozetlerContent />}</ProfilPageGate>
  );
}
