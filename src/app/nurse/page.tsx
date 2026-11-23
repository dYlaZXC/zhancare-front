"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NursePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home visits page by default
    router.replace("/nurse/home-visits");
  }, [router]);

  return null;
}
