"use client";

import { motion } from "framer-motion";
import SignOutButton from "@/components/dashboard/SignOutButton";

type DashboardHeaderProps = {
  userName: string;
};

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-10 sm:mb-12"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="bg-gradient-to-b from-white via-amber-100 to-amber-300/90 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            AstroTag
          </h1>
          <p className="mt-3 text-sm text-white/45">
            Hoş geldin,{" "}
            <span className="font-medium text-amber-200/80">{userName}</span>
          </p>
        </div>
        <SignOutButton compact className="mt-1" />
      </div>
    </motion.header>
  );
}
