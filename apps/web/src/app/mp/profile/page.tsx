"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/shell/AppProvider";

export default function MpProfile() {
  const router = useRouter();
  const { setRole } = useApp();

  useEffect(() => {
    setRole("mp");
    router.replace("/vision");
  }, [router, setRole]);

  return null;
}

