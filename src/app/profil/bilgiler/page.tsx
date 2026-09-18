"use client";

import dynamic from "next/dynamic";
import ProfilPageGate from "@/components/profil/ProfilPageGate";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";

const ProfilBilgilerContent = dynamic(
  () => import("@/components/profil/ProfilBilgilerContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ProfilBilgilerPage() {
  return (
    <ProfilPageGate>
      {(user) => (user ? <ProfilBilgilerContent user={user} /> : null)}
    </ProfilPageGate>
  );
}
