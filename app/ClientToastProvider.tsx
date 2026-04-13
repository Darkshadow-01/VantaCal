"use client";

import dynamic from "next/dynamic";

const ToastProvider = dynamic(
  () => import("@/components/ui/toast").then((mod) => ({ default: mod.ToastProvider })),
  { ssr: false, loading: () => null }
);

export default function ClientToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}